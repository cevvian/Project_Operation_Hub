import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attachment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload along with attachment info',
    type: CreateAttachmentDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachmentsService.create(file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attachments with pagination' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.attachmentsService.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID' })
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all attachments for a task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.attachmentsService.findByTask(taskId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attachment (metadata or replace file)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Optional new file to replace and/or metadata update',
    type: UpdateAttachmentDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    return this.attachmentsService.updateFile(id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an attachment' })
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(id);
  }
}
