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
import { UserParameters } from './models/user-parameters';
import { SearchParameters } from './models/search-parameters';

@Injectable()
export class RoomsService {
  private waitingQueue: {
    [key: string]: {
      observer: Subscriber<string>;
      userParameters: any;
      searchParameters: any;
    };
  } = {};
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
  searchForChat(
    userId: string,
    userParameters: UserParameters,
    searchParameters: SearchParameters,
  ): Observable<string | null> {
    return new Observable<string | null>((observer) => {
      // Проверяем, есть ли уже пользователь в очереди
      if (this.waitingQueue[userId]) {
        observer.next(null);
        observer.complete();
        return;
      }

      // Добавляем пользователя в очередь
      this.waitingQueue[userId] = {
        observer,
        userParameters,
        searchParameters,
      };

      // Проверяем очередь каждые 5 секунд
      const intervalId = setInterval(() => {
        // Если найден партнер для чата
        if (Object.keys(this.waitingQueue).length > 1) {
          const partnerId = Object.keys(this.waitingQueue).find((id) => {
            // Убедитесь, что это не тот же самый пользователь
            if (id === userId) return false;

            // Тут вы можете проверять параметры userParameters и searchParameters
            // и определить, подходят ли они друг другу

            const partner = this.waitingQueue[id];
            return this.doTheyMatch(
              userParameters,
              partner.userParameters,
              searchParameters,
              partner.searchParameters,
            );
          });

          if (partnerId) {
            console.log('it works?');
            // Создаем комнату для них
            const roomNumber = this.generateUniqueRoomNumber();
            const room = new this.roomModel({
              users: [userId, partnerId],
              roomNumber,
            });
            room.save().then(() => {
              console.log(this.waitingQueue[userId]?.observer);
              console.log(this.waitingQueue[partnerId]?.observer);
              console.log(roomNumber);

              // Уведомляем обоих пользователей о комнате
              this.waitingQueue[userId]?.observer.next(roomNumber);
              this.waitingQueue[partnerId]?.observer.next(roomNumber);
              this.waitingQueue[userId]?.observer.complete();
              this.waitingQueue[partnerId]?.observer.complete();

              delete this.waitingQueue[userId];
              delete this.waitingQueue[partnerId];
            });

            clearInterval(intervalId);
          } else {
            console.log('it doestn work');
            // Если по параметрам чела не нашлось, уведомляем, что нужно поменять параметры
            this.waitingQueue[userId].observer.next('NOT_FOUND');
            this.waitingQueue[userId].observer.complete();
            clearInterval(intervalId);
          }
        }
      }, 1000);

      // Если пользователь ждал партнера слишком долго
      setTimeout(() => {
        clearInterval(intervalId);
        this.waitingQueue[userId]?.observer.next(null); // завершаем поток
        this.waitingQueue[userId]?.observer.complete();
        delete this.waitingQueue[userId];
      }, 120000); // Например, 2 минуты
    });
  }

  doTheyMatch(
    user1Parameters: UserParameters,
    user2Parameters: UserParameters,
    user1Search: SearchParameters,
    user2Search: SearchParameters,
  ): boolean {
    return (
      this.isUserMatching(user1Parameters, user2Search) &&
      this.isUserMatching(user2Parameters, user1Search)
    );
  }

  isUserMatching(
    userParameters: UserParameters,
    searchParameters: SearchParameters,
  ): boolean {
    console.log('userParameters', userParameters);
    console.log('searchParameters', searchParameters);
    // Проверка пола
    if (searchParameters.gender !== userParameters.gender) return false;

    // Проверка размера
    if (
      userParameters.size < searchParameters.minSize ||
      userParameters.size > searchParameters.maxSize
    )
      return false;

    // Проверка возраста
    if (
      userParameters.age < searchParameters.minAge ||
      userParameters.age > searchParameters.maxAge
    )
      return false;

    // Проверка телосложения
    if (
      searchParameters.build !== null &&
      searchParameters.build !== userParameters.build
    )
      return false;

    // Проверка роли
    if (
      searchParameters.role !== null &&
      searchParameters.role !== userParameters.role
    )
      return false;

    // Проверка фетишей
    if (searchParameters.footFetish !== userParameters.footFetish) return false;
    if (searchParameters.chmor !== userParameters.chmor) return false;
    if (searchParameters.otherFetishes !== userParameters.otherFetishes)
      return false;

    return true;
  }

  stopSearch(userId: string): void {
    if (this.waitingQueue[userId]) {
      this.waitingQueue[userId]?.observer.next(null); // завершаем поток
      this.waitingQueue[userId]?.observer.complete();
      delete this.waitingQueue[userId];
    }
  }
}
