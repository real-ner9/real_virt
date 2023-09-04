import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  deleteDelay = 1 * 60 * 60 * 1000;
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
}
