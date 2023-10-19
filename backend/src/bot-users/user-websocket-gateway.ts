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

  inviteToChat(userFromId: string, userToId: string) {
    this.server.to(userToId).emit('inviteToChat', { from: userFromId });
  }

  getUser(authString: string): TgUser | null {
    const data = new URLSearchParams(authString);
    const userData = data.get('user');

    return userData ? JSON.parse(userData) : null;
  }
}
