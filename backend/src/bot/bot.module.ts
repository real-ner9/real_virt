import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { RoomsService } from './room.service';
import { BotActionsService } from './bot-actions.service';
import { MessageService } from './message.service';
import { UserService } from './user.service';
import { BotController } from './bot.controller';

@Module({
  providers: [
    BotService,
    RoomsService,
    BotActionsService,
    MessageService,
    UserService,
  ],
  controllers: [BotController],
})
export class BotModule {}
