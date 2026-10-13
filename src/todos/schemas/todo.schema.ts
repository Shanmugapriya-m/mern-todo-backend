import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Attachment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

export type TodoDocument = HydratedDocument<Todo>;

@Schema({ timestamps: true })
export class Todo {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments: Types.DocumentArray<Attachment>;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);
