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
import { UsersWebSocketGateway } from './user-websocket-gateway';
import { Connection } from './schemas/connection.entity';
import { ChatRequest } from './schemas/chat-request.entity';
import { ProfileMatchModule } from '../profile-match/profile-match.module';
import { FileStoreModule } from '../file-store/file-store.module';
import { UserBlockEntity } from './schemas/user-block.entity';
import { UserComplaintEntity } from './schemas/user-complaint.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Like,
      Dislike,
      UserLiked,
      Match,
      Connection,
      ChatRequest,
      UserBlockEntity,
      UserComplaintEntity,
    ]),
    ProfileMatchModule,
    FileStoreModule,
  ],
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
    {
      provide: 'CONNECTION_REPOSITORY',
      useValue: Connection,
    },
    {
      provide: 'CHAT_REQUEST_REPOSITORY',
      useValue: ChatRequest,
    },
    {
      provide: 'BLOCK_REPOSITORY',
      useValue: UserBlockEntity,
    },
    {
      provide: 'USER_COMPLAINT_REPOSITORY',
      useValue: UserComplaintEntity,
    },
    UserActionsService,
    UsersWebSocketGateway,
  ],
  controllers: [UserController],
  exports: [UserService, UserActionsService],
})
export class BotUsersModule {}
