import { Controller, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UpdateBuildStatusDto } from './dto/update-build-status.dto';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { BuildsService } from './builds.service';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';

@ApiTags('Builds')
@Controller('builds')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Patch(':id/status')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('apiKey') // For Swagger documentation
  @ApiOperation({ summary: 'Update the status of a build (called by Jenkins)' })
  updateBuildStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateBuildStatusDto: UpdateBuildStatusDto,
  ) {
    return this.buildsService.updateStatusFromJenkins(id, updateBuildStatusDto);
  }
}

