import { Controller, Get, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { CommitService } from './commit.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Commits')
@Controller('commits')
export class CommitController {
  constructor(private readonly commitService: CommitService) {}

  @Get()
  @ApiOperation({ summary: 'Get all commits for a repository' })
  @ApiQuery({ name: 'repoId', required: true, description: 'ID of the repository' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('repoId', new ParseUUIDPipe()) repoId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.commitService.findAll(repoId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single commit by ID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commitService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a commit' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.commitService.remove(id);
  }
}

