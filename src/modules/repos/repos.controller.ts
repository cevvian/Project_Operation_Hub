import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReposService } from './repos.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { UpdateRepoDto } from './dto/update-repo.dto';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@Controller('repos')
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new repository for a project' })
  create(@Body() createRepoDto: CreateRepoDto, @CurrentUser() user) {
    return this.reposService.create(createRepoDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all repos' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.reposService.findAll(page,limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repository details by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Repository ID' })
  findOne(@Param('id') id: string) {
    return this.reposService.findOne(id);
  }

  @Get('/project/:projectId')
  @ApiOperation({ summary: 'Get all repositories of a project' })
  @ApiParam({ name: 'projectId', type: 'string' })
  findByProject(@Param('projectId') projectId: string) {
    return this.reposService.findByProject(projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a repository' })
  @ApiParam({ name: 'id', type: 'string' })
  update(@Param('id') id: string, @Body() updateRepoDto: UpdateRepoDto) {
    return this.reposService.update(id, updateRepoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repository by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id') id: string) {
    return this.reposService.remove(id);
  }
}
