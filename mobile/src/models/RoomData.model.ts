import {Message} from './Message.model';

export interface RoomData {
  id: number;
  roomNumber: string;
  messages: Message[];
  // Дополнительные поля, если есть
}
