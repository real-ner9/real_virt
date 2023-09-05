import { Injectable } from '@nestjs/common';

export type UserFlag = 'all' | 'activeRoom' | 'currentPartner';

@Injectable()
export class UserService {
  // deleteDelay = 1 * 60 * 60 * 1000; // в часах
  deleteDelay = 30 * 60 * 1000; // пока оставлю 30 минут, так как мало пользователей
  users: Record<
    string,
    {
      activeRoom: string;
      pastPartners: string[];
      currentPartner: string;
      lastCleaned: number;
    }
  > = {};

  constructor() {
    setInterval(() => this.removePastPartners(), this.deleteDelay);
  }

  private removePastPartners() {
    const now = Date.now();
    const oneDay = this.deleteDelay;

    for (const userId in this.users) {
      const user = this.users[userId];

      if (now - user.lastCleaned >= oneDay) {
        user.pastPartners = [];
        user.lastCleaned = now;
      }
    }
  }

  setActiveRoom(userId: string, roomId: string): void {
    if (!this.users[userId]) {
      this.users[userId] = {
        activeRoom: '',
        pastPartners: [],
        lastCleaned: Date.now(),
        currentPartner: null,
      };
    }
    this.users[userId].activeRoom = roomId;
  }

  addPastPartner(userId: string, partnerId: string): void {
    if (!this.users[userId]) {
      this.users[userId] = {
        activeRoom: '',
        pastPartners: [],
        lastCleaned: Date.now(),
        currentPartner: null,
      };
    }
    this.users[userId].pastPartners.push(partnerId);
  }

  setCurrentPartner(userId: string, partnerId: string): void {
    if (!this.users[userId]) {
      this.users[userId] = {
        activeRoom: '',
        pastPartners: [],
        lastCleaned: Date.now(),
        currentPartner: null,
      };
    }
    this.users[userId].currentPartner = partnerId;
  }

  getActiveRoom(userId: string): string {
    return this.users[userId]?.activeRoom;
  }

  getPastPartners(userId: string): string[] {
    return this.users[userId]?.pastPartners || [];
  }

  getCurrentPartner(userId: string): string {
    return this.users[userId]?.currentPartner || null;
  }
  countUsers(flag: UserFlag): number {
    let count = 0;

    for (const userId in this.users) {
      const user = this.users[userId];

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
}
