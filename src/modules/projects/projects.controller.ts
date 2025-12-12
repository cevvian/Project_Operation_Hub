import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { User } from '../auth/decorator/user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite members to a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'uuid-of-project' })
  inviteMembers(@Param('id') projectId: string, @Body() dto: InviteProjectMemberDto) {
    dto.projectId = projectId;
    return this.projectsService.inviteMembers(dto);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept an invitation to join a project' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.projectsService.acceptInvitation(dto.token);
  }

  @Delete(':projectId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'uuid-of-project' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'uuid-of-user' })
  removeMember(@Param('projectId') projectId: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(projectId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.projectsService.findAll(Number(page), Number(limit));
  }

  @Get('/my-projects')
  @ApiOperation({ summary: 'Get all my projects (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAllMyProject(@Query('page') page = 1, @Query('limit') limit = 10,  @User('sub') userId: string) {
    return this.projectsService.getMyProject(Number(page), Number(limit), userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
