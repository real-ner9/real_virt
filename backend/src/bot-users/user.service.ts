import { Injectable, NotFoundException } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './schemas/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState } from './types/user-state';
import { UserRole } from './types/user-role';
import { Like } from './schemas/like.entity';
import { Dislike } from './schemas/dislike.entity';
import { Connection } from './schemas/connection.entity';
import { ChatRequest } from './schemas/chat-request.entity';
import { Page, paginate } from '../utils/paginate';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { UserBlock } from './schemas/user-block.entity';
import { ComplaintType, UserComplaint } from './schemas/user.complaint.entity';
import { FileStoreService } from '../file-store/file-store.service';
import { InvitationLink } from './schemas/invitation-link.entity';

export type UserFlag = 'all' | 'activeRoom' | 'currentPartner';

@Injectable()
export class UserService {
  // deleteDelay in minutes
  deleteDelay = 30 * 60 * 1000;
  showedFeedParams = [
    'user.id',
    'user.currentPartner',
    'user.age',
    'user.online',
    'user.name',
    'user.role',
    'user.photoUrl',
    'user.description',
    'user.lastLoginTimestamp',
  ];
  showedMatchParams = [
    ...this.showedFeedParams,
    'user.username',
    'user.showUsername',
  ];

  // Initialize user cache
  userCache: Record<string, User> = {};

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Dislike)
    private readonly dislikeRepository: Repository<Dislike>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(ChatRequest)
    private readonly chatRequestRepository: Repository<ChatRequest>,
    @InjectRepository(UserBlock)
    private readonly blockRepository: Repository<UserBlock>,
    @InjectRepository(UserComplaint)
    private readonly complaintRepository: Repository<UserComplaint>,
    @InjectRepository(InvitationLink)
    private readonly invitationRepository: Repository<InvitationLink>,
    private readonly fileStoreService: FileStoreService,
  ) {
    setTimeout(async () => {
      await this.clearConnections();
    });

    setInterval(async () => {
      this.invalidateCache();
      try {
        await this.removePastPartners();
        await this.disconnectIdlePartners();
      } catch (e) {
        console.error(
          'removePastPartners or disconnectIdlePartners error: ',
          e.message,
        );
      }
    }, this.deleteDelay);
  }

  private async clearConnections() {
    try {
      await this.connectionRepository.clear();
    } catch (error) {
      console.error('Error clearing connections table:', error.message);
    }
  }

  async checkAndClearConnections() {
    const fortyFiveMinutesAgo = Date.now() - 45 * 60 * 1000;

    await this.connectionRepository
      .createQueryBuilder()
      .delete()
      .from(Connection)
      .where(
        '"user_id" IN (SELECT "userId" FROM "user" WHERE "online" = :online AND "lastLoginTimestamp" < :timeLimit)',
        { online: true, timeLimit: fortyFiveMinutesAgo },
      )
      .execute();

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ online: false })
      .where('online = :online', { online: true })
      .andWhere('lastLoginTimestamp < :timeLimit', {
        timeLimit: fortyFiveMinutesAgo,
      })
      .execute();
  }

  private async removePastPartners(): Promise<void> {
    const now = Date.now();
    const oneDay = this.deleteDelay;

    try {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          pastPartners: [],
          lastCleaned: now,
        })
        .where('(:now - lastCleaned) >= :oneDay', { now, oneDay })
        .execute();
    } catch (e) {
      console.error('removePastPartners error:', e.message);
    }
  }

  private invalidateCache() {
    // Invalidate cache every deleteDelay
    this.userCache = {};
  }

  async getUserFromCacheOrDB(userId: string | number): Promise<User | null> {
    userId = `${userId}`;
    if (this.userCache[userId]) {
      return this.userCache[userId];
    }
    const user = await this.userRepository.findOne({
      where: { userId },
    });
    if (user) {
      this.updateCache(user);
    }
    return user || null;
  }

  async setActiveRoom(userId: string, roomId: string): Promise<void> {
    let user = await this.getUserFromCacheOrDB(userId);
    if (!user) {
      user = new User(userId);
      user.pastPartners = [];
    }
    user.state = UserState.QUICK_SEARCH;
    user.activeRoom = roomId;
    await this.userRepository.save(user);
    this.userCache[userId] = user; // Update the cache
  }

  async getLastSearchTimestamp(userId: string): Promise<number | null> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.lastSearchTimestamp || null;
  }

  async setLastSearchTimestamp(userId: string): Promise<void> {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user) {
      user.lastSearchTimestamp = Date.now();
      await this.userRepository.save(user);
      this.userCache[userId] = user; // Update the cache
    }
  }

  async getLastNotificationTimestamp(userId: string): Promise<number | null> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.lastNotificationTimestamp || null;
  }

  async setLastNotificationTimestamp(userId: string): Promise<void> {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user) {
      user.lastNotificationTimestamp = Date.now();
      await this.userRepository.save(user);
      this.userCache[userId] = user; // Update the cache
    }
  }

  async addPastPartner(userId: string, partnerId: string): Promise<void> {
    let user = await this.getUserFromCacheOrDB(userId);
    if (!user) {
      user = new User(userId);
      user.pastPartners = [];
      user.lastCleaned = Date.now();
      user.currentPartner = null;
    }
    if (!user.pastPartners) {
      user.pastPartners = [];
    }
    user.pastPartners.push(partnerId);
    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async setCurrentPartner(userId: string, partnerId: string): Promise<void> {
    let user = await this.getUserFromCacheOrDB(userId);

    if (!user) {
      user = new User(userId);
      user.activeRoom = '';
      user.pastPartners = [];
      user.lastCleaned = Date.now();
      user.currentPartner = null;
    }

    user.currentPartner = partnerId;
    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async setLastMessageTimestamp(userId: string): Promise<void> {
    const user = await this.getUserFromCacheOrDB(userId);

    user.lastMessageTimestamp = Date.now();
    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async getActiveRoom(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.activeRoom || '';
  }

  async getPastPartners(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['dislikes'],
    });
    if (!user) {
      return [];
    }

    const pastPartners = user.pastPartners || [];

    // Извлекаем ID партнеров, которых пользователь "дизлайкнул"
    const dislikedUserIds = user.dislikes
      ? user.dislikes.map((dislike) => dislike.dislikedUserId)
      : [];

    return Array.from(new Set([...pastPartners, ...dislikedUserIds]));
  }

  async getCurrentPartner(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.currentPartner || null;
  }

  async countUsers(): Promise<Record<UserFlag, number>> {
    const allCount = await this.userRepository.count();

    const activeRoomCount = await this.userRepository.count({
      where: {
        activeRoom: Not(IsNull()),
        currentPartner: IsNull(),
      },
    });

    const currentPartnerCount = await this.userRepository.count({
      where: {
        currentPartner: Not(IsNull()),
      },
    });

    return {
      all: allCount,
      activeRoom: activeRoomCount,
      currentPartner: currentPartnerCount,
    };
  }

  private updateCache(user: User): void {
    this.userCache[user.userId] = user;
  }

  async usersWithoutRoom(userId: string): Promise<string[]> {
    const DELAY = 60 * 60 * 1000;
    const preparedDelay = Date.now() - DELAY;

    const availablePartners = await this.userRepository
      .createQueryBuilder('user')
      .select('user.userId')
      .where('user.enableNotification = TRUE')
      .andWhere('user.isBlocked = FALSE')
      .andWhere('user.activeRoom IS NULL')
      .andWhere('user.currentPartner IS NULL')
      .andWhere('user.userId NOT IN (SELECT unnest(user.pastPartners))')
      .andWhere(
        '(user.lastNotificationTimestamp IS NULL OR user.lastNotificationTimestamp <= :preparedDelay)',
        { preparedDelay },
      )
      .andWhere(
        'user.userId IN (SELECT match.matchedUserId FROM Match match WHERE match.user_id = :userId)',
        { userId },
      )
      .getRawMany();

    return availablePartners.map((user) => user.user_userId);
  }

  async blockUser(userId: string) {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user && !user.isBlocked) {
      user.isBlocked = true;
      user.currentPartner = null;
      user.activeRoom = null;
      user.pastPartners = [];
      await this.userRepository.save(user);
    }
  }

  async unblockUser(userId: string) {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user && user.isBlocked) {
      user.isBlocked = false;
      await this.userRepository.save(user);
    }
  }

  async toggleNotification(userId: string, flag: boolean) {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user && user.enableNotification !== flag) {
      user.enableNotification = flag;
      await this.userRepository.save(user);
    }
  }

  // Данный метод создан для тех случаев,
  // когда пользаки перешли из бота в лс или просто забили и не общаются, но находятся в комнате
  // метод вычисляет таких и удаляет все связи друг с другом
  private async disconnectIdlePartners(): Promise<void> {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

    try {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          activeRoom: null,
          currentPartner: null,
          lastMessageTimestamp: null,
        })
        .where('activeRoom IS NOT NULL')
        .andWhere('currentPartner IS NOT NULL')
        .andWhere(
          '(array_length(pastPartners, 1) IS NULL OR array_length(pastPartners, 1) = 0)',
        )
        .andWhere(
          '(lastMessageTimestamp IS NULL OR lastMessageTimestamp < :fifteenMinutesAgo)',
          { fifteenMinutesAgo },
        )
        .execute();
    } catch (e) {
      console.error('disconnectIdlePartners error:', e.message);
    }
  }

  async addLike(userId: string, partnerId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['dislikes', 'likes'],
    });
    if (!user) return;

    const existingDislike = user.dislikes.find(
      (dislike) => dislike.dislikedUserId === partnerId,
    );
    if (existingDislike) {
      await this.dislikeRepository.remove(existingDislike);
    }

    const existingLike = user.likes.find(
      (like) => like.likedUserId === partnerId,
    );
    if (!existingLike) {
      const newLike = new Like(user, partnerId);
      await this.likeRepository.save(newLike);
    }
  }

  async webAddLike(
    socketId: string,
    partnerId: number,
  ): Promise<{ user: User; partner: User; hasPartnerLikedUser: boolean }> {
    // Находим соединение по socketId
    const connection = await this.connectionRepository.findOne({
      where: { connectId: socketId },
      relations: ['user'],
    });
    if (!connection || !connection.user) return;

    // Получаем userId из соединения и находим пользователя и партнера
    const userId = connection.user.userId;
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: partnerId },
      relations: ['connections'],
    });
    if (!user || !partner) return;

    await this.addLike(user.userId, partner.userId);

    const hasPartnerLikedUser = await this.hasUserLikedPartner(
      partner.userId,
      user.userId,
    );

    return { user, partner, hasPartnerLikedUser };
  }

  async addDislike(userId: string, partnerId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['dislikes', 'likes', 'sentRequests'],
    });
    if (!user) return;

    // Удаляем partnerId из likes, если он там есть
    const existingLike = user.likes.find(
      (like) => like.likedUserId === partnerId,
    );
    if (existingLike) {
      await this.likeRepository.remove(existingLike);
    }

    const existingChatRequest = await this.chatRequestRepository.findOne({
      where: {
        sender: { userId },
        receiver: { userId: partnerId },
      },
    });
    if (existingChatRequest) {
      await this.chatRequestRepository.remove(existingChatRequest);
    }

    // Добавляем partnerId в dislikes, если его там нет
    const existingDislike = user.dislikes.find(
      (dislike) => dislike.dislikedUserId === partnerId,
    );
    if (!existingDislike) {
      const newDislike = new Dislike(user, partnerId);
      await this.dislikeRepository.save(newDislike);
    }
  }

  async webAddDislike(
    socketId: string,
    partnerId: number,
  ): Promise<{ user: User; partner: User }> {
    // Находим соединение по socketId
    const connection = await this.connectionRepository.findOne({
      where: { connectId: socketId },
      relations: ['user'],
    });
    if (!connection || !connection.user) return;

    // Получаем userId из соединения и находим пользователя и партнера
    const userId = connection.user.userId;
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: partnerId },
      relations: ['connections'],
    });
    if (!user || !partner) return;

    await this.addDislike(user.userId, partner.userId);

    return { user, partner };
  }

  async hasUserLikedPartner(
    userId: string,
    partnerId: string,
  ): Promise<boolean> {
    // Получаем пользователя с userId и его лайками
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['likes'],
    });

    // Если пользователь не найден, возвращаем false
    if (!user) return false;

    // Проверяем, есть ли в лайках partnerId
    const existingLike = user.likes.find(
      (like) => like.likedUserId === partnerId,
    );

    // Возвращаем true, если лайк найден, иначе false
    return !!existingLike;
  }

  async getDislikes(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['dislikes'],
    });

    return user?.dislikes.map((dislike) => dislike.dislikedUserId) || [];
  }

  async getAllActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        enableNotification: true,
        activeRoom: null,
        currentPartner: null,
      },
    });
  }

  async updateBlockStatusForUsers(
    blockedUsers: string[],
    unblockedUsers: string[],
  ): Promise<void> {
    try {
      if (blockedUsers.length > 0) {
        await this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({ isBlocked: true })
          .where('userId IN (:...blockedUsers)', { blockedUsers })
          .execute();
      }
      if (unblockedUsers.length > 0) {
        await this.userRepository
          .createQueryBuilder('user')
          .update(User)
          .set({ isBlocked: false })
          .where('userId IN (:...unblockedUsers)', { unblockedUsers })
          .execute();
      }
    } catch (e) {
      console.error('updateBlockStatusForUsers error:', e.message);
    }
  }

  async getUserState(userId: string): Promise<UserState> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.state;
  }

  async setState(userId: string, state: UserState): Promise<void> {
    let user = await this.getUserFromCacheOrDB(userId);
    if (!user) {
      user = new User(userId);
    }

    user.state = state;
    await this.userRepository.save(user);
    this.userCache[userId] = user; // Update the cache
  }

  async getName(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.name;
  }

  async setName(userId: string, name: string, username: string | null) {
    let user = await this.getUserFromCacheOrDB(userId);

    if (!user) {
      user = new User(userId);
    }

    user.name = name;
    user.username = username;
    if (!user.age) {
      user.showUsername = true;
    }

    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async getAge(userId: string): Promise<number> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.age;
  }

  async setAge(userId: string, age: string | number) {
    const preparedAge = +age;
    const user = await this.getUserFromCacheOrDB(userId);

    if (preparedAge && user) {
      user.age = preparedAge;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.role;
  }

  async setRole(userId: string, role: UserRole) {
    const user = await this.getUserFromCacheOrDB(userId);

    if (role && user) {
      user.role = role;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async getDescription(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.description;
  }

  async setDescription(userId: string, description: string) {
    const user = await this.getUserFromCacheOrDB(userId);

    if (description && user) {
      user.description = description;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async getPhoto(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.photoUrl;
  }

  async getProfileVisible(userId: string): Promise<boolean> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.isVisibleToOthers;
  }

  async getUsernameVisible(userId: string): Promise<boolean> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user?.showUsername;
  }

  async setProfileVisible(userId: string, isVisible: boolean) {
    const user = await this.getUserFromCacheOrDB(userId);

    if (user) {
      user.isVisibleToOthers = isVisible;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async setUsernameVisible(
    userId: string,
    isVisible: boolean,
    username: string | null,
  ) {
    const user = await this.getUserFromCacheOrDB(userId);

    if (user) {
      user.showUsername = isVisible;
      user.username = username;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async setPhoto(userId: string, photoId: string) {
    const user = await this.getUserFromCacheOrDB(userId);

    if (user) {
      user.photoUrl = photoId;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async getRandomUser(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        Like,
        'like',
        'like.user_id = :userId AND like.likedUserId = user.userId',
        { userId },
      )
      .leftJoinAndSelect(
        Dislike,
        'dislike',
        'dislike.user_id = :userId AND dislike.dislikedUserId = user.userId',
        { userId },
      )
      .where('user.userId != :userId')
      .andWhere('user.isBlocked = false')
      .andWhere('user.isVisibleToOthers = true')
      .andWhere('dislike.id IS NULL')
      .andWhere('like.id IS NULL')
      .orderBy('RANDOM()')
      .getOne();

    return user || null;
  }

  async getLikedUser(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        Like,
        'likedMe',
        '(likedMe.user_id = user.userId AND likedMe.likedUserId = :userId)',
        { userId },
      )
      .leftJoin(
        Like,
        'iLiked',
        '(iLiked.user_id = :userId AND iLiked.likedUserId = user.userId)',
        { userId },
      )
      .leftJoinAndSelect(
        Dislike,
        'dislike',
        '(dislike.user_id = :userId AND dislike.dislikedUserId = user.userId)',
        { userId },
      )
      .where('user.userId != :userId')
      .andWhere('user.isBlocked = false')
      .andWhere('user.isVisibleToOthers = true')
      .andWhere('dislike.id IS NULL')
      .andWhere('likedMe.id IS NOT NULL')
      .andWhere('iLiked.id IS NULL')
      .orderBy('likedMe.id', 'DESC')
      .getOne();

    return user || null;
  }

  async getMatchesUser(
    userId: string,
    offset: number = 0,
  ): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        Like,
        'likeOutgoing',
        '(likeOutgoing.user_id = :userId AND likeOutgoing.likedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        Like,
        'likeIncoming',
        '(likeIncoming.user_id = user.userId AND likeIncoming.likedUserId = :userId)',
        { userId },
      )
      .leftJoin(
        Dislike,
        'dislike',
        '(dislike.user_id = :userId AND dislike.dislikedUserId = user.userId)',
        { userId },
      )
      .where('user.userId != :userId')
      .andWhere('user.isBlocked = false')
      .andWhere('user.isVisibleToOthers = true')
      .andWhere('dislike.id IS NULL')
      .andWhere('likeIncoming.id IS NOT NULL')
      .andWhere('likeOutgoing.id IS NOT NULL')
      .orderBy('user.id', 'DESC') // Указывает порядок сортировки
      .skip(offset)
      .take(1)
      .getOne();

    return user || null;
  }

  async getOnline(userId: string | number): Promise<boolean> {
    const user = await this.getUserFromCacheOrDB(`${userId}`);

    return user?.online || null;
  }

  async setOnline(userId: number | string, online: boolean) {
    const user = await this.getUserFromCacheOrDB(`${userId}`);

    if (user) {
      user.online = online;

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async setConnection(userId: string | number, connectionId: string) {
    const user = await this.userRepository.findOne({
      where: { userId: `${userId}` },
      relations: ['connections'],
    });

    if (!user) return;

    const existingConnection = user.connections.find(
      (connection) => connection.connectId === connectionId,
    );
    if (existingConnection) {
      return await this.connectionRepository.remove(existingConnection);
    }

    const newConnection = new Connection(user, connectionId);

    return await this.connectionRepository.save(newConnection);
  }

  async removeConnectionWithSocketId(connectionId: string) {
    const connection = await this.connectionRepository.findOne({
      where: { connectId: connectionId },
      relations: ['user'],
    });

    if (connection) {
      await this.connectionRepository.remove(connection);

      const activeConnections = await this.connectionRepository.count({
        where: { user: { id: connection.user.id } },
      });

      if (activeConnections === 0 && connection.user) {
        connection.user.online = false;
        await this.userRepository.save(connection.user);
      }
    }
  }

  async getMatches(userId: number | string) {
    userId = `${userId}`;
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select(this.showedMatchParams)
      .leftJoinAndSelect('user.receivedRequests', 'receivedRequest')
      .leftJoinAndSelect('receivedRequest.sender', 'sender')
      .leftJoinAndSelect('receivedRequest.receiver', 'receiver')
      .leftJoin(
        UserBlock,
        'blocksByMe',
        '(blocksByMe.user_id = :userId AND blocksByMe.blockedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        UserBlock,
        'blockedByOthers',
        '(blockedByOthers.user_id = user.userId AND blockedByOthers.blockedUserId = :userId)',
        { userId },
      )
      .leftJoin(
        Like,
        'likeOutgoing',
        '(likeOutgoing.user_id = :userId AND likeOutgoing.likedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        Like,
        'likeIncoming',
        '(likeIncoming.user_id = user.userId AND likeIncoming.likedUserId = :userId)',
        { userId },
      )
      .leftJoin(
        Dislike,
        'dislike',
        '(dislike.user_id = :userId AND dislike.dislikedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        ChatRequest,
        'sentRequest',
        'sentRequest.sender_id = user.userId AND sentRequest.receiver_id = :userId',
        { userId },
      )
      .where('user.userId != :userId')
      .andWhere('user.isBlocked = false')
      .andWhere('user.isVisibleToOthers = true')
      .andWhere('dislike.id IS NULL')
      .andWhere('likeIncoming.id IS NOT NULL')
      .andWhere('likeOutgoing.id IS NOT NULL')
      .andWhere('user.blockReason IS NULL')
      .andWhere('blocksByMe.id IS NULL')
      .andWhere('blockedByOthers.id IS NULL')
      .andWhere('sentRequest.id IS NULL') // исключаем пользователей, которые отправили запрос
      .orderBy(
        'CASE ' +
          'WHEN likeOutgoing.id IS NULL THEN likeIncoming.id ' +
          'WHEN likeIncoming.id IS NULL THEN likeOutgoing.id ' +
          'WHEN likeOutgoing.id > likeIncoming.id THEN likeOutgoing.id ' +
          'ELSE likeIncoming.id END',
        'DESC',
      );
    const users = await baseQuery.getMany();
    const total = await baseQuery.getCount();

    // Добавляем поле, показывающее, был ли отправлен запрос на чат
    const enhancedUsers = users.map(
      ({ receivedRequests, showUsername, username, ...user }) => ({
        ...user,
        username: showUsername ? username : null,
        chatRequested: !!(
          receivedRequests &&
          receivedRequests?.length &&
          receivedRequests.find(({ sender }) => sender.userId === userId)
        ),
      }),
    );

    return paginate({
      list: enhancedUsers,
      totalElements: total,
      pageSize: 1,
      pageNumber: 1,
    });
  }

  async getRequests(userId: number | string) {
    userId = `${userId}`;
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select(this.showedMatchParams)
      .leftJoin(
        UserBlock,
        'blocksByMe',
        '(blocksByMe.user_id = :userId AND blocksByMe.blockedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        UserBlock,
        'blockedByOthers',
        '(blockedByOthers.user_id = user.userId AND blockedByOthers.blockedUserId = :userId)',
        { userId },
      )
      .innerJoinAndSelect(
        'user.sentRequests',
        'chatRequest',
        'chatRequest.sender_id = user.userId',
      )
      .where('chatRequest.receiver_id = :userId', { userId })
      .andWhere('user.blockReason IS NULL')
      .andWhere('blocksByMe.id IS NULL')
      .andWhere('blockedByOthers.id IS NULL')
      .orderBy('chatRequest.requestedAt', 'DESC');
    const users = await baseQuery.getMany();

    const total = await baseQuery.getCount();

    const enhancedUsers = users.map(({ showUsername, username, ...user }) => ({
      ...user,
      username: showUsername ? username : null,
    }));

    return paginate<User>({
      list: enhancedUsers,
      totalElements: total,
      pageSize: 1,
      pageNumber: 1,
    });
  }

  async getFeed(
    userId: string | number,
    pageSize: number,
    pageNumber: number,
  ): Promise<Page<User>> {
    userId = `${userId}`;
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select(this.showedFeedParams)
      .leftJoin(
        UserBlock,
        'blocksByMe',
        '(blocksByMe.user_id = :userId AND blocksByMe.blockedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        UserBlock,
        'blockedByOthers',
        '(blockedByOthers.user_id = user.userId AND blockedByOthers.blockedUserId = :userId)',
        { userId },
      )
      .leftJoin(
        Like,
        'like',
        '(like.user_id = :userId AND like.likedUserId = user.userId)',
        { userId },
      )
      .leftJoinAndSelect(
        Dislike,
        'dislike',
        '(dislike.user_id = :userId AND dislike.dislikedUserId = user.userId)',
        { userId },
      )
      .where('(user.userId != :userId)')
      .andWhere('(user.isBlocked = false)')
      .andWhere('(user.isVisibleToOthers = true)')
      .andWhere('(dislike.id IS NULL)')
      .andWhere('(like.id IS NULL)')
      .andWhere('user.blockReason IS NULL')
      .andWhere('blocksByMe.id IS NULL')
      .andWhere('blockedByOthers.id IS NULL')
      .addOrderBy('user.lastLoginTimestamp', 'DESC')
      .addOrderBy('user.photoUrl', 'ASC');

    // Получение пользователей с учетом пагинации
    const users = await baseQuery
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Получение общего количества пользователей, соответствующих вашему запросу
    const total = await baseQuery.getCount();

    // Возвращение пользователей вместе с пагинационной информацией
    return paginate<User>({
      list: users,
      totalElements: total,
      pageSize,
      pageNumber,
    });
  }

  async getUsersWhoLikedMe(
    userId: string | number,
    pageSize: number,
    pageNumber: number,
  ): Promise<Page<User>> {
    userId = `${userId}`;
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .select(this.showedFeedParams)
      .leftJoin(
        UserBlock,
        'blocksByMe',
        '(blocksByMe.user_id = :userId AND blocksByMe.blockedUserId = user.userId)',
        { userId },
      )
      .leftJoin(
        UserBlock,
        'blockedByOthers',
        '(blockedByOthers.user_id = user.userId AND blockedByOthers.blockedUserId = :userId)',
        { userId },
      )
      .leftJoinAndSelect(
        Like,
        'likedMe',
        '(likedMe.user_id = user.userId AND likedMe.likedUserId = :userId)',
        { userId },
      )
      .leftJoinAndSelect(
        Like,
        'iLiked',
        '(iLiked.user_id = :userId AND iLiked.likedUserId = user.userId)',
        { userId },
      )
      .where('user.userId != :userId')
      .andWhere('user.isBlocked = false')
      .andWhere('user.blockReason IS NULL')
      .andWhere('user.isVisibleToOthers = true')
      .andWhere('blocksByMe.id IS NULL')
      .andWhere('blockedByOthers.id IS NULL')
      .andWhere('likedMe.id IS NOT NULL')
      .andWhere('iLiked.id IS NULL')
      .orderBy('likedMe.id', 'DESC');

    // Получение пользователей с учетом пагинации
    const users = await baseQuery
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Получение общего количества пользователей, которые лайкнули текущего пользователя
    const total = await baseQuery.getCount();

    // Возвращение пользователей вместе с пагинационной информацией
    return paginate<User>({
      list: users,
      totalElements: total,
      pageSize,
      pageNumber,
    });
  }

  async requestMatch(
    socketId: string,
    partnerId: number,
  ): Promise<{ user: User; partner: User }> {
    const connection = await this.connectionRepository.findOne({
      where: { connectId: socketId },
      relations: ['user'],
    });
    if (!connection || !connection.user) return;

    const userId = connection.user.userId;
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: partnerId },
      relations: ['connections'],
    });
    if (!user || !partner) return;

    const existingChatRequest = await this.chatRequestRepository.findOne({
      where: {
        sender: { id: user.id },
        receiver: { id: partner.id },
      },
    });
    if (!existingChatRequest) {
      const newChatRequest = new ChatRequest(user, partner);
      await this.chatRequestRepository.save(newChatRequest);

      return { user, partner: partner };
    }
  }

  async cancelRequestMatch(
    socketId: string,
    partnerId: number,
  ): Promise<{ user: User; partner: User }> {
    // Находим соединение по socketId
    const connection = await this.connectionRepository.findOne({
      where: { connectId: socketId },
      relations: ['user'],
    });
    if (!connection || !connection.user) return;

    // Получаем userId из соединения и находим пользователя и партнера
    const userId = connection.user.userId;
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: partnerId },
      relations: ['connections'],
    });
    if (!user || !partner) return;

    // Проверяем наличие существующего запроса на чат между этими двумя пользователями
    const existingChatRequest = await this.chatRequestRepository.findOne({
      where: {
        sender: { id: user.id },
        receiver: { id: partner.id },
      },
    });
    if (existingChatRequest) {
      // Если существующий запрос на чат найден, удаляем его
      await this.chatRequestRepository.remove(existingChatRequest);

      return { user, partner };
    }
  }

  async cancelRequest(
    socketId: string,
    partnerId: number,
    approved: boolean = false,
  ): Promise<{ user: User; partner: User; hasPartners: boolean }> {
    // Находим соединение по socketId
    const connection = await this.connectionRepository.findOne({
      where: { connectId: socketId },
      relations: ['user'],
    });
    if (!connection || !connection.user) return;

    // Получаем userId из соединения и находим пользователя и партнера
    const userId = connection.user.userId;
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: partnerId },
      relations: ['connections'],
    });
    if (!user || !partner) return;

    // Проверяем наличие существующего запроса на чат между этими двумя пользователями
    const existingChatRequest = await this.chatRequestRepository.findOne({
      where: {
        sender: { id: partner.id },
        receiver: { id: user.id },
      },
    });
    if (existingChatRequest) {
      // Если существующий запрос на чат найден, удаляем его
      await this.chatRequestRepository.remove(existingChatRequest);
      const hasPartners = !!(partner.currentPartner || user.currentPartner);
      if (approved && !hasPartners) {
        const room = randomStringGenerator();

        await this.setActiveRoom(user.userId, room);
        await this.setActiveRoom(partner.userId, room);
        await this.setCurrentPartner(user.userId, partner.userId);
        await this.setCurrentPartner(partner.userId, user.userId);
        await this.setState(user.userId, UserState.IN_CHAT);
        await this.setState(partner.userId, UserState.IN_CHAT);
      }

      return { user, partner, hasPartners };
    }
  }

  async getLastLoginTimestamp(userId: string): Promise<number | null> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.lastLoginTimestamp || null;
  }

  async setLastLoginTimestamp(userId: string | number) {
    userId = `${userId}`;
    const user = await this.getUserFromCacheOrDB(userId);

    if (user) {
      const now = Date.now();
      const debounce = 30 * 60 * 1000;

      // если обновлялось меньше чем 30 минут назад, то не обновляем
      // сделано для того, чтобы в feed не скакали записи
      if (
        !user.lastLoginTimestamp ||
        now - user.lastLoginTimestamp > debounce
      ) {
        user.lastLoginTimestamp = now;
      }

      if (user.isBlocked) {
        user.isBlocked = false;
      }

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async setBlockByUser(userId: string | number, blockedUserId: number) {
    userId = `${userId}`;
    // Находим пользователя, который хочет заблокировать другого пользователя
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: blockedUserId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!partner) {
      throw new Error('Partner not found');
    }

    // Проверка, существует ли уже блокировка между этими двумя пользователями
    const existingBlock = await this.blockRepository.findOne({
      where: { user: { id: user.id }, blockedUserId: `${partner.userId}` },
    });

    if (existingBlock) {
      throw new Error('This user has already been blocked by the current user');
    }

    // Создание новой блокировки
    const block = new UserBlock(user, `${partner.userId}`);
    await this.blockRepository.save(block);

    return { id: partner.id };
  }

  async reportUser(
    userId: string | number,
    reportedUserId: number,
    reason: ComplaintType,
  ) {
    userId = `${userId}`;
    // Находим пользователя, который хочет заблокировать другого пользователя
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: reportedUserId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!partner) {
      throw new Error('Partner not found');
    }

    // id для бана, это нужно будет переделывать потом, но пока так
    if (
      user.userId === '719307698' ||
      user.userId === '6433634025' ||
      user.userId === '499387702'
    ) {
      if (reason === ComplaintType.AGE_VIOLATION) {
        if (partner.photoUrl) {
          await this.fileStoreService.deleteFromS3(partner.photoUrl);
          await this.setPhoto(partner.userId, null);
        }

        await this.banUser(partner.userId, reason);
      }

      if (reason === ComplaintType.OFFENSIVE_BEHAVIOR && partner.description) {
        await this.setDescription(partner.userId, ' ');
      }

      if (reason === ComplaintType.UNACCEPTABLE_CONTENT && partner.photoUrl) {
        await this.fileStoreService.deleteFromS3(partner.photoUrl);
        await this.setPhoto(partner.userId, null);
      }
    } else {
      // Проверка, существует ли уже жалоба между этими двумя пользователями
      const existingComplaint = await this.complaintRepository.findOne({
        where: { user: { id: user.id }, reportedUserId: `${partner.userId}` },
      });

      if (existingComplaint) {
        throw new Error(
          'This user has already been blocked by the current user',
        );
      }

      const complaint = new UserComplaint(user, `${partner.userId}`, reason);
      await this.complaintRepository.save(complaint);
      await this.setBlockByUser(userId, reportedUserId);
    }

    return { id: partner.id };
  }

  async removeMatch(userId: string | number, removedUserId: number) {
    userId = `${userId}`;
    // Находим пользователя, который хочет заблокировать другого пользователя
    const user = await this.userRepository.findOne({ where: { userId } });
    const partner = await this.userRepository.findOne({
      where: { id: removedUserId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!partner) {
      throw new Error('Partner not found');
    }

    await this.addDislike(user.userId, partner.userId);
    await this.addDislike(partner.userId, user.userId);
    return { id: partner.id };
  }

  async unbanUser(userId: string | number): Promise<void> {
    userId = `${userId}`;
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    user.blockedUntil = null;
    user.blockReason = null;

    await this.userRepository.save(user);
  }

  async banUser(userId: string | number, reason: ComplaintType): Promise<void> {
    userId = `${userId}`;
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    user.blockedUntil = new Date();
    user.blockReason = reason;

    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async addInvitation(
    userId: string,
    inviterId: string,
  ): Promise<{ message: string }> {
    const user = await this.getUserFromCacheOrDB(userId);
    const inviter = await this.getUserFromCacheOrDB(inviterId);

    if (userId === inviterId) {
      return { message: 'Один и тот же пользователь' };
    }

    if (!user || !inviter) {
      return { message: 'Пользователей не существует' };
    }

    if (user.name) {
      return { message: 'Пользователь уже существует' };
    }

    const existingInvite = await this.invitationRepository.findOne({
      where: { invitedUserId: userId },
    });

    if (existingInvite) {
      return { message: 'Пользователя уже кто-то пригласил' };
    }

    const newInvite = new InvitationLink(inviterId, userId);

    await this.invitationRepository.save(newInvite);

    return { message: 'Инвайт добавлен' };
  }

  async getInvitationCount(userId: string): Promise<number> {
    // Получаем количество приглашенных пользователей, где userId является пригласившим
    const count = await this.invitationRepository.count({
      where: { userId: userId },
    });

    return count;
  }
}
