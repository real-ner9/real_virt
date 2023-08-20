import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop()
  user: string; // Привязка к пользователю (по ObjectId)

  @Prop()
  content: string; // Содержание сообщения

  @Prop({ type: Date, default: Date.now })
  timestamp: Date; // Временная метка сообщения
}

export const MessageSchema = SchemaFactory.createForClass(Message);