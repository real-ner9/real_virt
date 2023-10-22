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

@WebSocketGateway({
  namespace: '/user',

  cors: { origin: '*', credentials: true },
})
export class UsersWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly userService: UserService) {}

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
      const { connections, user } = await this.userService.requestMatch(
        client.id,
        data.id,
      );
      client.emit('requestMatchResponse', { success: true });

      connections.forEach((connection) => {
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
      const { connections, user } = await this.userService.cancelRequestMatch(
        client.id,
        data.id,
      );
      client.emit('cancelRequestMatchResponse', { success: true });

      connections.forEach((connection) => {
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

  inviteToChat(userFromId: string, userToId: string) {
    this.server.to(userToId).emit('inviteToChat', { from: userFromId });
  }

  getUser(authString: string): TgUser | null {
    const data = new URLSearchParams(authString);
    const userData = data.get('user');

    return userData ? JSON.parse(userData) : null;
  }
}
