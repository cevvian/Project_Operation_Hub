import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { User } from '../auth/decorator/user.decorator';
import { MoveTaskDto } from './dto/move-task.dto';

@ApiTags('Tasks')
@UseGuards(AuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Param('projectId') projectId: string, @Body() createTaskDto: CreateTaskDto, @User('sub') userId: string) {
    return this.tasksService.create({ ...createTaskDto, projectId }, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks for a project' })
  findByProject(@Param('projectId') projectId: string, @User('sub') userId: string) {
    // TODO: Add filters via @Query()
    return this.tasksService.findByProject(projectId, userId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a single task by ID' })
  findOne(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @User('sub') userId: string) {
    return this.tasksService.findOne(taskId, projectId, userId);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @User('sub') userId: string,
  ) {
    return this.tasksService.update(taskId, projectId, userId, updateTaskDto);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('projectId') projectId: string, @Param('taskId') taskId: string, @User('sub') userId: string) {
    return this.tasksService.remove(taskId, projectId, userId);
  }

  @Post(':taskId/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Move a task between sprints/statuses or reorder' })
  move(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() moveTaskDto: MoveTaskDto,
    @User('sub') userId: string,
  ) {
    return this.tasksService.move(taskId, projectId, userId, moveTaskDto);
  }
}
