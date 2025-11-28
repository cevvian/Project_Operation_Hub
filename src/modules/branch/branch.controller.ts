import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Branches')
@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.branchService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one branch by ID' })
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Find branches by task ID' })
  findByTask(@Param('taskId') taskId: string) {
    return this.branchService.findBranchesByTask(taskId);
  }

  @Get('repo/:repoId')
  @ApiOperation({ summary: 'Find branches by repo ID' })
  findByRepo(@Param('repoId') repoId: string) {
    return this.branchService.findBranchesByRepo(repoId);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Update a branch' })
  // update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
  //   return this.branchService.update(id, updateBranchDto);
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}