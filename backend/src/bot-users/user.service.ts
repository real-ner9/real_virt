import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './schemas/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserState } from './types/user-state';
import { UserRole } from './types/user-role';
import { Like } from './schemas/like.entity';
import { Dislike } from './schemas/dislike.entity';
import { Match } from './schemas/match.entity';
import { UserLiked } from './schemas/user-liked.entity';

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
      .getOne();

    return user || null;
  }

  async getMatchesUser(
    userId: string,
    offset: number = 0,
  ): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        Like,
        'likeOutgoing',
        'likeOutgoing.user_id = :userId AND likeOutgoing.likedUserId = user.userId',
        { userId },
      )
      .innerJoin(
        Like,
        'likeIncoming',
        'likeIncoming.likedUserId = :userId AND likeIncoming.user_id = user.userId',
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
      .orderBy('user.userId', 'ASC') // Указывает порядок сортировки
      .skip(offset)
      .take(1)
      .getOne();

    return user || null;
  }
}
