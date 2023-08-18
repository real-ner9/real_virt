import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import {
  catchError,
  from,
  map,
  mergeMap,
  Observable,
  of,
  throwError,
} from 'rxjs';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  createRoom(): Observable<Room> {
    return this.createUniqueRoomNumber().pipe(
      map((roomNumber) => new this.roomModel({ roomNumber })),
      mergeMap((room) => room.save()),
    );
  }

  getRoomByNumber(roomNumber: string): Observable<Room> {
    return from(
      this.roomModel.findOne({ roomNumber }).populate('messages').exec(),
    );
  }

  addMessageToRoom(
    roomNumber: string,
    userId: string,
    content: string,
  ): Observable<Room> {
    return from(this.roomModel.findOne({ roomNumber })).pipe(
      mergeMap((room) => {
        if (!room) {
          return of(null); // Комната не найдена
        }

        const message = new this.messageModel({ user: userId, content });
        return from(message.save()).pipe(
          mergeMap(() => {
            room.messages.push(message);
            return from(room.save());
          }),
        );
      }),
    );
  }
  generateUniqueRoomNumber(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const roomNumberLength = 6;
    let roomNumber = '';

    for (let i = 0; i < roomNumberLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      roomNumber += characters[randomIndex];
    }

    return roomNumber;
  }

  createUniqueRoomNumber(): Observable<string> {
    const generatedRoomNumber = this.generateUniqueRoomNumber();

    return from(
      this.roomModel.findOne({ roomNumber: generatedRoomNumber }),
    ).pipe(
      mergeMap((existingRoom) => {
        if (!existingRoom) {
          return of(generatedRoomNumber);
        } else {
          return this.createUniqueRoomNumber(); // Попробовать снова
        }
      }),
    );
  }

  deleteRoom(roomNumber: string): Observable<void> {
    return from(this.roomModel.findOneAndDelete({ roomNumber })).pipe(
      mergeMap((deletedRoom) => {
        if (!deletedRoom) {
          throw new NotFoundException(
            `Room with number ${roomNumber} not found`,
          );
        }
        return of(null);
      }),
      catchError((error) => {
        return throwError(
          new InternalServerErrorException(
            'An error occurred while deleting the room',
          ),
        );
      }),
    );
  }
}
