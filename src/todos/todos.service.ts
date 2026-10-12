import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './schemas/todo.schema';

@Injectable()
export class TodosService {
  constructor(@InjectModel(Todo.name) private todoModel: Model<Todo>) {}

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
    this.assertValidId(id);
    const todo = await this.todoModel.findByIdAndDelete(id).exec();
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  private assertValidId(id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException(`Todo ${id} not found`);
  }
}
