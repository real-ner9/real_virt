import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from './schemas/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

export type UserFlag = 'all' | 'activeRoom' | 'currentPartner';

@Injectable()
export class UserService {
  // deleteDelay in minutes
  deleteDelay = 30 * 60 * 1000;

  // Initialize user cache
  userCache: Record<string, UserEntity> = {};

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    setInterval(() => {
      this.invalidateCache();
      this.removePastPartners();
    }, this.deleteDelay);
  }

  private async removePastPartners(): Promise<void> {
    const now = Date.now();
    const oneDay = this.deleteDelay;

    const allUsers = await this.userRepository.find();

    for (const user of allUsers) {
      if (now - user.lastCleaned >= oneDay) {
        user.pastPartners = [];
        user.lastCleaned = now;
        await this.userRepository.save(user);
      }
    }
  }

  private invalidateCache() {
    // Invalidate cache every deleteDelay
    this.userCache = {};
  }

  private async getUserFromCacheOrDB(
    userId: string,
  ): Promise<UserEntity | null> {
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
      user = this.userRepository.create({ userId, pastPartners: [] });
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
      user = this.userRepository.create({
        userId,
        pastPartners: [],
        lastCleaned: Date.now(),
        currentPartner: null,
      });
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
      user = this.userRepository.create({
        userId,
        activeRoom: '',
        pastPartners: [],
        lastCleaned: Date.now(),
        currentPartner: null,
      });
      await this.userRepository.save(user);
      this.updateCache(user);
    }

    user.currentPartner = partnerId;
    await this.userRepository.save(user);
    this.updateCache(user);
  }

  async getActiveRoom(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.activeRoom || '';
  }

  async getPastPartners(userId: string): Promise<string[]> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.pastPartners || [];
  }

  async getCurrentPartner(userId: string): Promise<string> {
    const user = await this.getUserFromCacheOrDB(userId);
    return user?.currentPartner || null;
  }

  async countUsers(flag: UserFlag): Promise<number> {
    let count = 0;
    const users = await this.userRepository.find();

    for (const user of users) {
      switch (flag) {
        case 'all':
          count++;
          break;
        case 'activeRoom':
          if (user.activeRoom && !user.currentPartner) {
            count++;
          }
          break;
        case 'currentPartner':
          if (user.currentPartner) {
            count++;
          }
          break;
      }
    }

    return count;
  }

  private updateCache(user: UserEntity): void {
    this.userCache[user.userId] = user;
  }

  async usersWithoutRoom(userId: string): Promise<string[]> {
    // Получаем всех пользователей из базы данных
    const allUsersFromDb = await this.userRepository.find();

    // Фильтруем пользователей на основе заданных условий
    const availablePartners = allUsersFromDb
      .filter((user) => {
        return (
          user.enableNotification &&
          !user.isBlocked &&
          !user.activeRoom &&
          !user.currentPartner &&
          !(user.pastPartners || []).includes(userId)
        );
      })
      .map((user) => user.userId);

    return availablePartners;
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
}
