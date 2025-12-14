import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
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
  @UseInterceptors(FileInterceptor('file')) // Must be before ApiConsumes/ApiBody
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload along with attachment info',
    type: CreateAttachmentDto,
  })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      // This check is crucial. If FileInterceptor doesn't find a file, it might not throw.
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    // Pass the entire file object, including the buffer, to the service.
    return this.attachmentsService.create(file, dto, user.sub);
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
