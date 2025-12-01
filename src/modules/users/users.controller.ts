import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post(':id')
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

  @Post(':id')
  @ApiOperation({summary: 'Create github token'})
  createToken(@Param('id') id: string, @Body() token: string){
    return this.usersService.createGitHubToken(token, id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Find one user by email' })
  findByEmail(@Query('email') email: string) {
    return this.usersService.findUserByEmail(email);
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
}
