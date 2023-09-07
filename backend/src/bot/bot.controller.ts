import { Controller, Get } from '@nestjs/common';
import { RoomsService } from './room.service';
import { UserService } from './user.service';

@Controller('bot')
export class BotController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    const statistic = `
      Активных комнат (всего, даже активная комната с 1 человеком): ${this.roomsService.getActiveRoomsCount()}<br>
      Активных комнат с 2 людьми: ${this.roomsService.getActiveRoomsCount(
        true,
      )}<br>
      Всего пользователей: ${await this.userService.countUsers('all')}<br>
      Всего пользователей, которые сейчас ищут комнату: ${await this.userService.countUsers(
        'activeRoom',
      )}<br>
      Всего пользователей, которые сейчас в чате: ${await this.userService.countUsers(
        'currentPartner',
      )}<br>
    `;
    return statistic;
  }
}
