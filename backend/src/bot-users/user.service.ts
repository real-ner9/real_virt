import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './schemas/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState } from './types/user-state';
import { UserRole } from './types/user-role';
import { Like } from './schemas/like.entity';
import { Dislike } from './schemas/dislike.entity';
import { Connection } from './schemas/connection.entity';
import { ChatRequest } from './schemas/chat-request.entity';
import { paginate } from '../utils/paginate';

export type UserFlag = 'all' | 'activeRoom' | 'currentPartner';

@Injectable()
export class UserService {
  // deleteDelay in minutes
  deleteDelay = 30 * 60 * 1000;

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
  ) {
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

  async getUserFromCacheOrDB(userId: string): Promise<User | null> {
    if (this.userCache[userId]) {
      return this.userCache[userId];
    }
    const user = await this.userRepository.findOne({
      where: { userId },
    });
    if (user) {
      this.updateCache(user);
    }
    return user;
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

  async addDislike(userId: string, partnerId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['dislikes', 'likes'],
    });
    if (!user) return;

    // Удаляем partnerId из likes, если он там есть
    const existingLike = user.likes.find(
      (like) => like.likedUserId === partnerId,
    );
    if (existingLike) {
      await this.likeRepository.remove(existingLike);
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

    await this.connectionRepository.remove(connection);

    const activeConnections = await this.connectionRepository.count({
      where: { user: { id: connection.user.id } },
    });

    if (activeConnections === 0 && connection.user) {
      connection.user.online = false;
      await this.userRepository.save(connection.user);
    }
  }

  async getMatches(userId: number | string) {
    userId = `${userId}`;
    const baseQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.receivedRequests', 'receivedRequest')
      .leftJoinAndSelect('receivedRequest.sender', 'sender')
      .leftJoinAndSelect('receivedRequest.receiver', 'receiver')
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
      .andWhere('sentRequest.id IS NULL') // исключаем пользователей, которые отправили запрос
      .orderBy('user.id', 'DESC');
    const users = await baseQuery.getMany();
    const total = await baseQuery.getCount();

    // Добавляем поле, показывающее, был ли отправлен запрос на чат
    const enhancedUsers = users.map(({ receivedRequests, ...user }) => ({
      ...user,
      chatRequested: !!(
        receivedRequests &&
        receivedRequests?.length &&
        receivedRequests.find(({ sender }) => sender.userId === userId)
      ),
    }));

    return paginate({
      list: enhancedUsers,
      totalElements: total,
      pageSize: 1,
      pageNumber: 1,
    });
  }

  async getRequests(userId: number | string) {
    userId = `${userId}`;
    const users = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.sentRequests',
        'chatRequest',
        'chatRequest.sender_id = user.userId',
      )
      .where('chatRequest.receiver_id = :userId', { userId })
      .orderBy('chatRequest.requestedAt', 'DESC')
      .getMany();

    const total = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect(
        'user.sentRequests',
        'chatRequest',
        'chatRequest.sender_id = user.userId',
      )
      .where('chatRequest.receiver_id = :userId', { userId })
      .orderBy('chatRequest.requestedAt', 'DESC')
      .getCount();

    return paginate<User>({
      list: users,
      totalElements: total,
      pageSize: 1,
      pageNumber: 1,
    });
  }
}
