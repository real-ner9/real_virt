import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Attachment } from '../models/attachment';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop()
  user: string; // Привязка к пользователю (по ObjectId)

  @Prop()
  content: string; // Содержание сообщения

  @Prop({ type: Date, default: Date.now })
  timestamp: Date; // Временная метка сообщения

  @Prop()
  attachments: Attachment[]; // вложения
}

export const MessageSchema = SchemaFactory.createForClass(Message);