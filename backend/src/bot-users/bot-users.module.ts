import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './schemas/user.entity';
import { UserService } from './user.service';
import { UserActionsService } from './user-actions.service';
import { Like } from './schemas/like.entity';
import { Dislike } from './schemas/dislike.entity';
import { UserLiked } from './schemas/user-liked.entity';
import { Match } from './schemas/match.entity';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Like, Dislike, UserLiked, Match])],
  providers: [
    UserService,
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
    {
      provide: 'LIKE_REPOSITORY',
      useValue: Like,
    },
    {
      provide: 'DISLIKE_REPOSITORY',
      useValue: Dislike,
    },
    {
      provide: 'USER_LIKED_REPOSITORY',
      useValue: UserLiked,
    },
    {
      provide: 'MATCH_REPOSITORY',
      useValue: Match,
    },
    UserActionsService,
  ],
  controllers: [UserController],
  exports: [UserService, UserActionsService],
})
export class BotUsersModule {}
