import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';

@WebSocketGateway()
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  users: { [key: string]: string } = {};

  constructor(private readonly service: RoomsService) {}

  handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    this.users[socket.id] = userId;
  }

  handleDisconnect(socket: Socket) {
    const userId = this.users[socket.id];
    if (userId) {
      // TODO: Optionally handle any logic when a user disconnects.
      delete this.users[socket.id];
    }
  }

  getOtherUserIdInRoom(
    roomNumber: string,
    currentUserId: string,
  ): string | undefined {
    const userIdsInRoom = Object.values(this.users).filter(
      (userId) => userId !== currentUserId,
    );
    return userIdsInRoom[0];
  }

  getSocketIdByUserId(userId: string): string | undefined {
    return Object.entries(this.users).find(([, id]) => id === userId)?.[0];
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    const { roomNumber, userId } = data;

    // TODO надо будет тут напсисать правильную проверку
    // const currentUsersInRoom = Object.values(this.users).filter(
    //   (id) => id !== userId,
    // );
    //
    // if (currentUsersInRoom.length > 2) {
    //   this.server.to(userId).emit('roomIsFull', { userId });
    //   return;
    // }

    const otherUserId = this.getOtherUserIdInRoom(roomNumber, userId);
    const otherSocketId = this.getSocketIdByUserId(otherUserId);
    if (otherSocketId) {
      this.server.to(otherSocketId).emit('userJoined', { userId });
    }

    socket.join(roomNumber);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() socket: Socket,
  ) {
    const { roomNumber, content, userId } = data;

    this.service.addMessageToRoom(roomNumber, content, userId).subscribe(
      () => {
        this.server
          .in(roomNumber)
          .emit('newMessage', { user: userId, content });
      },
      (error) => {
        console.error('Error handling message:', error);
        // Optionally send an error message back to the client.
        socket.emit('errorMessage', {
          message: 'Unable to process your message.',
        });
      },
    );
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
    const { roomNumber } = data;
    socket.leave(roomNumber);

    const userId = this.users[socket.id];
    if (userId) {
      // TODO: Optionally notify other users in the room about this user leaving.
      delete this.users[socket.id];
    }
  }
}
