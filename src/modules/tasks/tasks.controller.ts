import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChangeStatusDto } from './dto/change-status.dto';
import { AssignDto } from './dto/assign.dto';
import { AddToSprintDto } from './dto/add-to-sprint.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Patch(':id/change-status')
  @ApiOperation({ summary: 'Change task status' })
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.tasksService.changeStatus(id, dto.status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a user to task' })
  assignTask(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.tasksService.assignTask(id, dto.userId);
  }

  @Patch(':id/add-to-sprint')
  @ApiOperation({ summary: 'Add task to a sprint' })
  addToSprint(@Param('id') id: string, @Body() dto: AddToSprintDto) {
    return this.tasksService.addToSprint(id, dto.sprintId);
  }
  
  @Post()
  @ApiOperation({ summary: 'Create new task' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.tasksService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
