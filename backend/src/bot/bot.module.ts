import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { RoomsService } from './room.service';
import { BotActionsService } from './bot-actions.service';
import { MessageService } from './message.service';
import { UserService } from './user.service';
import { BotController } from './bot.controller';
import { UserEntity } from './schemas/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [
    BotService,
    RoomsService,
    BotActionsService,
    MessageService,
    UserService,
    {
      provide: 'USER_REPOSITORY',
      useValue: UserEntity,
    },
  ],
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [BotController],
})
export class BotModule {}
