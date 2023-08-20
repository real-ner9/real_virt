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
  Subscriber,
  throwError,
} from 'rxjs';

@Injectable()
export class RoomsService {
  private waitingQueue: { [key: string]: Subscriber<string> } = {};
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
    content: string,
    userId: string,
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
  searchForChat(userId: string): Observable<string | null> {
    return new Observable<string | null>((observer) => {
      // Проверяем, есть ли уже пользователь в очереди
      if (this.waitingQueue[userId]) {
        observer.next(null);
        observer.complete();
        return;
      }

      // Добавляем пользователя в очередь
      this.waitingQueue[userId] = observer;

      console.log(this.waitingQueue.length, observer);

      // Проверяем очередь каждые 5 секунд
      const intervalId = setInterval(() => {
        // Если найден партнер для чата
        if (Object.keys(this.waitingQueue).length > 1) {
          const partnerId = Object.keys(this.waitingQueue).find(
            (id) => id !== userId,
          );

          if (partnerId) {
            // Создаем комнату для них
            const roomNumber = this.generateUniqueRoomNumber();
            const room = new this.roomModel({
              users: [userId, partnerId],
              roomNumber,
            });
            room.save().then(() => {
              // Уведомляем обоих пользователей о комнате
              this.waitingQueue[userId].next(roomNumber);
              this.waitingQueue[partnerId].next(roomNumber);
              this.waitingQueue[userId].complete();
              this.waitingQueue[partnerId].complete();

              delete this.waitingQueue[userId];
              delete this.waitingQueue[partnerId];
            });

            clearInterval(intervalId);
          }
        }
      }, 1000);

      // Если пользователь ждал партнера слишком долго
      setTimeout(() => {
        clearInterval(intervalId);
        this.waitingQueue[userId].next(null); // завершаем поток
        this.waitingQueue[userId].complete();
        delete this.waitingQueue[userId];
      }, 120000); // Например, 2 минуты
    });
  }

  stopSearch(userId: string): void {
    if (this.waitingQueue[userId]) {
      this.waitingQueue[userId].next(null); // завершаем поток
      this.waitingQueue[userId].complete();
      delete this.waitingQueue[userId];
    }
  }
}
