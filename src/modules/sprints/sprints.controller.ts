import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseBoolPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { User } from '../auth/decorator/user.decorator';

@ApiTags('Sprints')
@UseGuards(AuthGuard)
@Controller('projects/:projectId/sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sprint within a project' })
  create(@Param('projectId') projectId: string, @Body() createSprintDto: CreateSprintDto, @User('sub') userId: string) {
    return this.sprintsService.create({ ...createSprintDto, projectId }, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Find all sprints for a project' })
  @ApiQuery({ name: 'includeTasks', required: false, type: Boolean, description: 'Set to true to include tasks in the response' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Comma-separated statuses, e.g. PLANNED,ACTIVE,COMPLETED' })
  @ApiQuery({ name: 'startFrom', required: false, type: String, description: 'ISO date, filter startDate >= startFrom' })
  @ApiQuery({ name: 'startTo', required: false, type: String, description: 'ISO date, filter startDate <= startTo' })
  @ApiQuery({ name: 'endFrom', required: false, type: String, description: 'ISO date, filter endDate >= endFrom' })
  @ApiQuery({ name: 'endTo', required: false, type: String, description: 'ISO date, filter endDate <= endTo' })
  findByProject(
    @Param('projectId') projectId: string,
    @User('sub') userId: string,
    @Query('includeTasks', new ParseBoolPipe({ optional: true })) includeTasks?: boolean,
    @Query('status') statusCsv?: string,
    @Query('startFrom') startFrom?: string,
    @Query('startTo') startTo?: string,
    @Query('endFrom') endFrom?: string,
    @Query('endTo') endTo?: string,
  ) {
    const statuses = statusCsv?.split(',').map(s => s.trim()).filter(Boolean);
    return this.sprintsService.findByProject(projectId, userId, includeTasks, { statuses, startFrom, startTo, endFrom, endTo });
  }

  @Get(':sprintId')
  @ApiOperation({ summary: 'Get a single sprint by ID' })
  findOne(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string, @User('sub') userId: string) {
    return this.sprintsService.findOne(sprintId, projectId, userId);
  }

  @Patch(':sprintId')
  @ApiOperation({ summary: 'Update a sprint' })
  update(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() updateSprintDto: UpdateSprintDto,
    @User('sub') userId: string,
  ) {
    return this.sprintsService.update(sprintId, projectId, userId, updateSprintDto);
  }

  @Delete(':sprintId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a sprint' })
  remove(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string, @User('sub') userId: string) {
    return this.sprintsService.remove(sprintId, projectId, userId);
  }

  @Post(':sprintId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a sprint' })
  startSprint(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string, @User('sub') userId: string) {
    return this.sprintsService.startSprint(sprintId, projectId, userId);
  }

  @Post(':sprintId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a sprint' })
  completeSprint(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string, @User('sub') userId: string) {
    return this.sprintsService.completeSprint(sprintId, projectId, userId);
  }
}
