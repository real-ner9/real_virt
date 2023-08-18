import {Message} from './Message.model';

export interface RoomData {
  roomNumber: string;
  messages: Message[];
  // Дополнительные поля, если есть
}
