import {
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosService } from './todos.service';

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 5);

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  addAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_UPLOAD_MB * 1024 * 1024,
            message: `File must be ${MAX_UPLOAD_MB} MB or smaller`,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.todosService.addAttachment(id, file);
  }

  @Get(':id/attachments/:attachmentId/url')
  getAttachmentUrl(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.todosService.getAttachmentUrl(id, attachmentId);
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.todosService.removeAttachment(id, attachmentId);
  }
}
