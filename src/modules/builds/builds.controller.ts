import { Controller, Patch, Param, Body, UseGuards, ParseUUIDPipe, Get, Query } from '@nestjs/common';
import { UpdateBuildStatusDto } from './dto/update-build-status.dto';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';
import { Public } from '../auth/guard/auth.guard';

@ApiTags('Builds')
@Controller()
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) { }

  /**
   * List all builds for a project
   */
  @Get('projects/:projectId/builds')
  @ApiOperation({ summary: 'List all builds for a project' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByProject(
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.buildsService.findByProject(
      projectId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * Get a single build by ID (includes console output)
   */
  @Get('builds/:id')
  @ApiOperation({ summary: 'Get build details including console output' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.buildsService.findOne(id);
  }

  /**
   * Update build status (called by Jenkins callback)
   */
  @Patch('builds/:id/status')
  @Public()
  @ApiSecurity('apiKey')
  @ApiOperation({ summary: 'Update the status of a build (called by Jenkins)' })
  updateBuildStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBuildStatusDto: UpdateBuildStatusDto,
  ) {
    return this.buildsService.updateStatusFromJenkins(id, updateBuildStatusDto);
  }
}
