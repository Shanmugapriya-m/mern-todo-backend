import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Module } from '../s3/s3.module';
import { Todo, TodoSchema } from './schemas/todo.schema';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
    S3Module,
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
