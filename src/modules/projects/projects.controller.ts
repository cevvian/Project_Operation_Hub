import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { Public, AuthGuard } from '../auth/guard/auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { User } from '../auth/decorator/user.decorator';
import { AuditLog } from '../audit-log/audit-log.decorator';
import { AUDIT_ACTIONS, AUDIT_SEVERITY, TARGET_TYPES } from '../audit-log/audit-log.constants';

@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @AuditLog({ action: AUDIT_ACTIONS.PROJECT_CREATE, targetType: TARGET_TYPES.PROJECT, includeBody: true })
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  async create(@Body() createProjectDto: CreateProjectDto, @User('sub') requestingUserId: string) {
    return this.projectsService.create(createProjectDto, requestingUserId);
  }

  @Post(':id/invite')
  @AuditLog({ action: AUDIT_ACTIONS.MEMBER_INVITE, targetType: TARGET_TYPES.PROJECT, targetIdParam: 'id' })
  @ApiOperation({ summary: 'Invite members to a project' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'uuid-of-project' })
  inviteMembers(
    @Param('id') projectId: string,
    @Body() dto: InviteProjectMemberDto,
    @User('sub') requestingUserId: string,
  ) {
    return this.projectsService.inviteMembers(projectId, dto, requestingUserId);
  }


  @Public()
  @Get('invitation/:token')
  @ApiOperation({ summary: 'Get details of an invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  getInvitationDetails(@Param('token') token: string) {
    return this.projectsService.getInvitationDetails(token);
  }

  @Get(':projectId/members/search')
  @ApiOperation({ summary: 'Search for users to invite to the project' })
  searchUsersToInvite(
    @Param('projectId') projectId: string,
    @Query('query') query: string,
  ) {
    return this.projectsService.searchUsersToInvite(projectId, query);
  }


  @Post('accept-invitation')
  @AuditLog({ action: AUDIT_ACTIONS.MEMBER_ACCEPT, targetType: TARGET_TYPES.PROJECT })
  @ApiOperation({ summary: 'Accept an invitation to join a project' })
  acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @User('sub') requestingUserId: string,
  ) {
    return this.projectsService.acceptInvitation(dto.token, requestingUserId);
  }

  @Delete(':projectId/members/:userId')
  @AuditLog({ action: AUDIT_ACTIONS.MEMBER_REMOVE, severity: AUDIT_SEVERITY.WARN, targetType: TARGET_TYPES.PROJECT, targetIdParam: 'projectId' })
  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID', example: 'uuid-of-project' })
  @ApiParam({ name: 'userId', description: 'User ID', example: 'uuid-of-user' })
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @User('sub') requestingUserId: string,
  ) {
    return this.projectsService.removeMember(projectId, userId, requestingUserId);
  }

  @Get(':projectId/members')
  @ApiOperation({ summary: 'Get all members of a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  getProjectMembers(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectMembers(projectId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by project name or owner name' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by: created, name, owner', example: 'created' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.projectsService.findAll(Number(page), Number(limit), search, sortBy);
  }

  @Get('/my-projects')
  @ApiOperation({ summary: 'Get all my projects (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findAllMyProject(@Query('page') page = 1, @Query('limit') limit = 10, @User('sub') userId: string) {
    return this.projectsService.getMyProject(Number(page), Number(limit), userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @AuditLog({ action: AUDIT_ACTIONS.PROJECT_UPDATE, targetType: TARGET_TYPES.PROJECT, includeBody: true })
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @AuditLog({ action: AUDIT_ACTIONS.PROJECT_DELETE, severity: AUDIT_SEVERITY.CRITICAL, targetType: TARGET_TYPES.PROJECT })
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID', example: 'a7d9c0c8-59c1-4634-8fa5-51e5f8e71d92' })
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
