import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../auth/decorator/user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateGitHubTokenDto } from './dto/create-github-token.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a new user' })
  verify(@Param('id') id: string) {
    return this.usersService.verifyAccount(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    page = Number(page);
    limit = Number(limit);
    return this.usersService.findAll(page,limit);
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
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('connect/github')
  @UseGuards(AuthGuard('github'))
  async connectGithubAccount(@User('sub') userId: string) {
    // This endpoint starts the GitHub connection process for a logged-in user.
    // The AuthGuard('github') will redirect to GitHub.
  }

  @Get('connect/github/callback')
  @UseGuards(AuthGuard('github'))
  async connectGithubAccountCallback(@User('sub') userId: string, @Req() req: any) {
    // After GitHub callback, req.user contains the GitHub profile.
    const githubProfile = req.user;
    await this.usersService.connectGithubAccount(userId, githubProfile.githubName);
    // You can redirect the user to a settings page or return a success message.
    return { message: 'GitHub account connected successfully.' };
  }
}
