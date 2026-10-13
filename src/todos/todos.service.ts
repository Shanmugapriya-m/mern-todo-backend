import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { isValidObjectId, Model } from 'mongoose';
import { S3Service } from '../s3/s3.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './schemas/todo.schema';

@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<Todo>,
    private readonly s3: S3Service,
  ) {}

  findAll() {
    return this.todoModel.find().sort({ createdAt: -1 }).exec();
  }

  create(dto: CreateTodoDto) {
    return this.todoModel.create(dto);
  }

  async update(id: string, dto: UpdateTodoDto) {
    this.assertValidId(id);
    const todo = await this.todoModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async remove(id: string) {
    const todo = await this.findOne(id);
    await this.s3.deleteMany(todo.attachments.map((a) => a.key));
    await todo.deleteOne();
    return todo;
  }

  async addAttachment(id: string, file: Express.Multer.File) {
    const todo = await this.findOne(id);
    const safeName = file.originalname.replace(/[^\w.-]+/g, '_');
    const key = `todos/${id}/${randomUUID()}-${safeName}`;

    await this.s3.upload(key, file.buffer, file.mimetype);
    try {
      const updated = await this.todoModel
        .findByIdAndUpdate(
          id,
          {
            $push: {
              attachments: {
                key,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
              },
            },
          },
          { new: true },
        )
        .exec();
      if (!updated) throw new NotFoundException(`Todo ${todo.id} not found`);
      return updated;
    } catch (err) {
      await this.s3.delete(key); // don't leave an orphaned object behind
      throw err;
    }
  }

  async getAttachmentUrl(id: string, attachmentId: string) {
    const attachment = await this.findAttachment(id, attachmentId);
    const url = await this.s3.getDownloadUrl(
      attachment.key,
      attachment.originalName,
    );
    return { url };
  }

  async removeAttachment(id: string, attachmentId: string) {
    const attachment = await this.findAttachment(id, attachmentId);
    await this.s3.delete(attachment.key);
    const todo = await this.todoModel
      .findByIdAndUpdate(
        id,
        { $pull: { attachments: { _id: attachment._id } } },
        { new: true },
      )
      .exec();
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  private async findOne(id: string) {
    this.assertValidId(id);
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  private async findAttachment(id: string, attachmentId: string) {
    const todo = await this.findOne(id);
    const attachment = isValidObjectId(attachmentId)
      ? todo.attachments.id(attachmentId)
      : null;
    if (!attachment)
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    return attachment;
  }

  private assertValidId(id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException(`Todo ${id} not found`);
  }
}
