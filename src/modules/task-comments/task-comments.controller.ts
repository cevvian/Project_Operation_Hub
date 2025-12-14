import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { User } from '../auth/decorator/user.decorator';

@ApiTags('Task Comments')
@UseGuards(AuthGuard)
@Controller('projects/:projectId/tasks/:taskId/comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment for a task' })
  create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() createTaskCommentDto: CreateTaskCommentDto,
    @User('sub') userId: string,
  ) {
    return this.taskCommentsService.create(projectId, { ...createTaskCommentDto, taskId }, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a specific task' })
  findByTask(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @User('sub') userId: string) {
    return this.taskCommentsService.findByTask(projectId, taskId, userId);
  }

  @Patch(':commentId')
  @ApiOperation({ summary: 'Update a comment' })
  update(
    @Param('projectId') projectId: string,
    @Param('commentId') commentId: string,
    @Body() updateTaskCommentDto: UpdateTaskCommentDto,
    @User('sub') userId: string,
  ) {
    return this.taskCommentsService.update(projectId, commentId, updateTaskCommentDto, userId);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment' })
  remove(@Param('projectId') projectId: string, @Param('commentId') commentId: string, @User('sub') userId: string) {
    return this.taskCommentsService.remove(projectId, commentId, userId);
  }
}
