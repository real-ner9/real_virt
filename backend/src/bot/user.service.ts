import { Injectable } from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './schemas/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomsService } from './room.service';

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
    private readonly roomService: RoomsService,
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

  private async getUserFromCacheOrDB(userId: string): Promise<User | null> {
    if (this.userCache[userId]) {
      return this.userCache[userId];
    }
    const user = await this.userRepository.findOne({ where: { userId } });
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
    const user = await this.getUserFromCacheOrDB(userId);
    if (!user) {
      return [];
    }

    const pastPartners = user.pastPartners || [];

    const dislikes = user.dislikes || [];

    return Array.from(new Set([...pastPartners, ...dislikes]));
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
      .andWhere(':userId = ANY(user.likes)', { userId })
      .andWhere(
        '(user.lastNotificationTimestamp IS NULL OR user.lastNotificationTimestamp <= :preparedDelay)',
        { preparedDelay },
      )
      .andWhere('user.userId NOT IN (SELECT unnest(user.pastPartners))', {
        userId,
      })
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
    const user = await this.getUserFromCacheOrDB(userId);
    if (user) {
      if (!user.likes) user.likes = [];
      if (!user.dislikes) user.dislikes = [];

      // Удаляем partnerId из dislikes, если он там есть
      user.dislikes = user.dislikes.filter((id) => id !== partnerId);

      // Добавляем partnerId в likes, если его там нет
      if (!user.likes.includes(partnerId)) {
        user.likes.push(partnerId);
      }

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async addDislike(userId: string, partnerId: string): Promise<void> {
    const user = await this.getUserFromCacheOrDB(userId);
    if (user) {
      if (!user.likes) user.likes = [];
      if (!user.dislikes) user.dislikes = [];

      // Удаляем partnerId из likes, если он там есть
      user.likes = user.likes.filter((id) => id !== partnerId);

      // Добавляем partnerId в dislikes, если его там нет
      if (!user.dislikes.includes(partnerId)) {
        user.dislikes.push(partnerId);
      }

      await this.userRepository.save(user);
      this.updateCache(user);
    }
  }

  async getDislikes(userId: string): Promise<string[]> {
    const user = await this.getUserFromCacheOrDB(userId);

    return user.dislikes || [];
  }

  async getAllActiveUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        isBlocked: false,
        enableNotification: true,
        activeRoom: null,
        currentPartner: null,
      },
    });
  }
}
