import { Controller, Get, Param, Delete, Query, ParseUUIDPipe, Patch, Body } from '@nestjs/common';
import { PullRequestService } from './pull-request.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UpdatePullRequestDto } from './dto/update-pull-request.dto';

@ApiTags('Pull Requests')
@Controller('pull-requests')
export class PullRequestController {
  constructor(private readonly pullRequestService: PullRequestService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pull requests for a repository' })
  @ApiQuery({ name: 'repoId', required: true, description: 'ID of the repository' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('repoId', new ParseUUIDPipe()) repoId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.pullRequestService.findAll(repoId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single pull request by ID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pullRequestService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pull request' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePullRequestDto: UpdatePullRequestDto,
  ) {
    return this.pullRequestService.update(id, updatePullRequestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pull request' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pullRequestService.remove(id);
  }
}


