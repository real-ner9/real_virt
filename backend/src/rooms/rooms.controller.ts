import {
  Controller,
  Post,
  Param,
  Get,
  Body,
  Delete,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';
import { catchError, Observable } from 'rxjs';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(): Observable<Room> {
    return this.roomsService.createRoom();
  }

  @Get(':roomNumber')
  getRoom(@Param('roomNumber') roomNumber: string): Observable<Room> {
    return this.roomsService.getRoomByNumber(roomNumber);
  }

  @Post(':roomNumber/messages')
  addMessage(
    @Param('roomNumber') roomNumber: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
  ): Observable<Room> {
    return this.roomsService.addMessageToRoom(roomNumber, userId, content);
  }

  @Delete(':roomNumber')
  deleteRoom(@Param('roomNumber') roomNumber: string): Observable<void> {
    return this.roomsService.deleteRoom(roomNumber).pipe(
      catchError((error) => {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(
          'An error occurred while deleting the room',
        );
      }),
    );
  }
}
