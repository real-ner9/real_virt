import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
import { Message } from './message.schema';

export type RoomDocument = Room & Document;

@Schema()
export class Room {
  @Prop({ unique: true })
  roomNumber: string; // Уникальный номер комнаты

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'Message' }] })
  messages: Message[]; // Список сообщений
}

export const RoomSchema = SchemaFactory.createForClass(Room);
