import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/decorator/user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateGitHubTokenDto } from './dto/create-github-token.dto';
import { AuditLog } from '../audit-log/audit-log.decorator';
import { AUDIT_ACTIONS, AUDIT_SEVERITY, TARGET_TYPES } from '../audit-log/audit-log.constants';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @AuditLog({ action: AUDIT_ACTIONS.USER_CREATE, targetType: TARGET_TYPES.USER, includeBody: true })
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a new user' })
  verify(@Param('id') id: string) {
    return this.usersService.verifyAccount(id);
  }

  @Patch(':id/status')
  @AuditLog({ action: AUDIT_ACTIONS.USER_STATUS_CHANGE, severity: AUDIT_SEVERITY.WARN, targetType: TARGET_TYPES.USER })
  @ApiOperation({ summary: 'Update user status (lock/unlock)' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status as any);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Send password reset email to user' })
  async resetPassword(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    // This will be handled by AuthService - for now just return success
    // In production, inject AuthService and call forgotPassword
    return { message: `Password reset email would be sent to ${user.email}` };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.usersService.findAll(page, limit, search, role);
  }

  @Post('/github-token')
  @ApiOperation({ summary: 'Create or update a user\'s GitHub token' })
  createToken(@User('sub') requestingUserId: string, @Body() createGitHubTokenDto: CreateGitHubTokenDto) {
    return this.usersService.createGitHubToken(createGitHubTokenDto.token, requestingUserId);
  }

  @Get('by-email')
  @ApiOperation({ summary: 'Find one user by email' })
  findByEmail(@Query('email') email: string) {
    return this.usersService.findUserByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @AuditLog({ action: AUDIT_ACTIONS.USER_UPDATE, targetType: TARGET_TYPES.USER, includeBody: true })
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @AuditLog({ action: AUDIT_ACTIONS.USER_DELETE, severity: AUDIT_SEVERITY.CRITICAL, targetType: TARGET_TYPES.USER })
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
