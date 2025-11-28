import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('task-comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new comment for a task' })
  create(@Body() dto: CreateTaskCommentDto, /*@Req() req*/) {
    return this.taskCommentsService.create(dto /*req.user*/);
  }
  
  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all comments of a specific task' })
  @ApiParam({ name: 'taskId', description: 'ID of the task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.taskCommentsService.findByTask(taskId);
  }

  @Get('task/:taskId/count')
  @ApiOperation({ summary: 'Count all comments of a task' })
  @ApiParam({ name: 'taskId', description: 'ID of the task' })
  countByTask(@Param('taskId') taskId: string) {
    return this.taskCommentsService.countByTask(taskId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments with pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.taskCommentsService.findAll(+page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  findOne(@Param('id') id: string) {
    return this.taskCommentsService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  update( @Param('id') id: string, @Body() dto: UpdateTaskCommentDto, ) {
    return this.taskCommentsService.update(id, dto);
  }

  // @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  remove(@Param('id') id: string) {
    return this.taskCommentsService.remove(id);
  }
}
