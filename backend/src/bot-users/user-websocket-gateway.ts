import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TgUser } from './types/tg-user';
import { checkSignature } from '../utils/check-signature';
import { UserService } from './user.service';
import { ProfileMatchActionsService } from '../profile-match/profile-match-actions.service';
import { forwardRef, Inject } from '@nestjs/common';
import * as process from 'process';

@WebSocketGateway({
  namespace: '/user',

  cors: { origin: '*', credentials: true },
})
export class UsersWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly userService: UserService,
    @Inject(forwardRef(() => ProfileMatchActionsService))
    private readonly profileMatchActionsService: ProfileMatchActionsService,
  ) {}

  async handleConnection(socket: Socket) {
    const authData = socket.handshake.query.authData as string;
    const check = checkSignature(authData, process.env.BOT_TOKEN);
    if (!check) {
      socket.emit('errorEvent', 'Пользователь не авторизован');
      socket.disconnect(true);

      return;
    }

    const user = this.getUser(authData);

    if (!user.id) {
      socket.emit('errorEvent', 'Пользователь не найден');
      socket.disconnect(true);

      return;
    }

    try {
      await this.userService.setOnline(user.id, true);
      await this.userService.setConnection(user.id, socket.id);
    } catch (e) {
      console.error('handleConnection error', e.message);
    }
  }

  async handleDisconnect(socket: Socket) {
    await this.userService.removeConnectionWithSocketId(socket.id);
  }

  @SubscribeMessage('inviteToChat')
  handleUserEvent(client, data): any {
    console.log(client, data);
  }

  @SubscribeMessage('requestMatch')
  async handleRequestMatch(client: Socket, data: { id: number }): Promise<any> {
    try {
      // Assume userService has a method to handle match requests
      const { user, partner } = await this.userService.requestMatch(
        client.id,
        data.id,
      );
      client.emit('requestMatchResponse', { success: true });

      await this.profileMatchActionsService.onRequestToChat(user, {
        partnerId: partner.userId,
      });
      partner.connections?.forEach((connection) => {
        try {
          this.server
            .to(connection.connectId)
            .emit('matchRequest', { user: user });
        } catch (e) {
          console.error('matchRequest: ', e.message);
        }
      });
    } catch (error) {
      console.error('handleRequestMatch error', error.message);
      client.emit('requestMatchResponse', { error: error.message });
    }
  }

  @SubscribeMessage('cancelRequestMatch')
  async handleCancelRequestMatch(
    client: Socket,
    data: { id: number },
  ): Promise<any> {
    try {
      // Assume userService has a method to handle match cancellation requests
      const { partner, user } = await this.userService.cancelRequestMatch(
        client.id,
        data.id,
      );
      client.emit('cancelRequestMatchResponse', { success: true });

      partner.connections?.forEach((connection) => {
        try {
          this.server
            .to(connection.connectId)
            .emit('matchRequestCanceled', { user: user });
        } catch (e) {
          console.error('matchRequestCancelled: ', e.message);
        }
      });
    } catch (error) {
      console.error('handleCancelRequestMatch error', error.message);
      client.emit('cancelRequestMatchResponse', { error: error.message });
    }
  }

  @SubscribeMessage('approveRequest')
  async handleApproveRequest(
    client: Socket,
    data: { id: number },
  ): Promise<any> {
    try {
      // Assume userService has a method to handle match requests
      const { partner, user, hasPartners } =
        await this.userService.cancelRequest(client.id, data.id, true);

      if (!hasPartners) {
        await this.profileMatchActionsService.onStartChat({
          partnerId: partner.userId,
          userId: user.userId,
        });

        client.emit('approveRequestResponse', { success: true });

        partner.connections?.forEach((connection) => {
          try {
            this.server
              .to(connection.connectId)
              .emit('requestApproved', { success: true });
          } catch (e) {
            console.error('matchRequest: ', e.message);
          }
        });
      }
    } catch (error) {
      console.error('handleRequestMatch error', error.message);
      client.emit('approveRequestResponse', { error: error.message });
    }
  }

  @SubscribeMessage('cancelRequest')
  async handleCancelRequest(
    client: Socket,
    data: { id: number },
  ): Promise<any> {
    try {
      // Assume userService has a method to handle match cancellation requests
      const { partner, user } = await this.userService.cancelRequest(
        client.id,
        data.id,
      );
      client.emit('cancelRequestResponse', { success: true });

      partner.connections?.forEach((connection) => {
        try {
          this.server
            .to(connection.connectId)
            .emit('requestCanceled', { user: user });
        } catch (e) {
          console.error('requestCancelled: ', e.message);
        }
      });
    } catch (error) {
      console.error('handleCancelRequest error', error.message);
      client.emit('cancelRequestResponse', { error: error.message });
    }
  }

  @SubscribeMessage('sendLike')
  async handleSendLike(client: Socket, data: { id: number }) {
    try {
      const { user, partner, hasPartnerLikedUser } =
        await this.userService.webAddLike(client.id, data.id);

      partner.connections?.forEach((connection) => {
        try {
          this.server
            .to(connection.connectId)
            .emit('liked', { user, hasPartnerLikedUser });
        } catch (e) {
          console.error('liked error: ', e.message);
        }
      });

      await this.profileMatchActionsService.like({
        user,
        partnerId: partner.userId,
        hasPartnerLikedUser: hasPartnerLikedUser,
      });

      return { success: true, id: data.id };
    } catch (error) {
      console.error('handleSendLike error', error.message);
      return { error: error.message };
    }
  }

  @SubscribeMessage('sendDislike')
  async handleSendDislike(client: Socket, data: { id: number }) {
    try {
      const { user, partner } = await this.userService.webAddDislike(
        client.id,
        data.id,
      );

      partner.connections?.forEach((connection) => {
        try {
          this.server.to(connection.connectId).emit('disliked', { user });
        } catch (e) {
          console.error('disliked error: ', e.message);
        }
      });

      return { success: true, id: data.id };
    } catch (error) {
      console.error('handleSendDislike error', error.message);
      return { error: error.message };
    }
  }

  inviteToChat(userFromId: string, userToId: string) {
    this.server.to(userToId).emit('inviteToChat', { from: userFromId });
  }

  getUser(authString: string): TgUser | null {
    const data = new URLSearchParams(authString);
    const userData = data.get('user');

    return userData ? JSON.parse(userData) : null;
  }
}
