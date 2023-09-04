import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomsService {
  private rooms: Room[] = [];

  constructor() {
    // Запуск функции удаления неактивных комнат каждые 10 минут
    setInterval(() => this.removeInactiveRooms(), 10 * 60 * 1000);
  }

  private removeInactiveRooms(): void {
    this.rooms = this.rooms.filter((room) => room.active);
  }

  createRoom(userId: string): Room {
    const room: Room = {
      id: Date.now().toString(),
      users: [userId],
      active: true,
    };
    this.rooms.push(room);
    return room;
  }

  findSingleUserRoom(userId: string): Room | undefined {
    return this.rooms.find(
      (room) =>
        room.users.length === 1 && room.active && room.users[0] !== userId,
    );
  }

  findRoomByUserId(userId: string): Room | undefined {
    return this.rooms.find(
      (room) => room.users.includes(userId) && room.active,
    );
  }

  addUserToRoom(userId: string, room: Room): Room {
    room.users.push(userId);
    room.active = true;
    return room;
  }

  deactivateRoom(room: Room): void {
    room.active = false;
  }
}

interface Room {
  id: string;
  users: string[];
  active: boolean;
}
