import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { Public } from './guard/auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from './decorator/user.decorator';
import { UsersService } from '../users/users.service';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
) {}

  @Public()
  @Post('login')
  async login(@Body() data: LoginUserDto) {
    return this.authService.signIn(data)
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post('register')
  async register(@Body() data: CreateUserDto) {
    return this.authService.register(data);
  }

  @Get('profile')
  getProfile(@User('id') userId: string) {
    return this.userService.findOne(userId)
  }

//   @UseGuards(AuthGuard)
//   @Get('profile')
//   getProfile(@Request() req) {
//     return req.user;
//   }

//   @Get()
//   findAll(@User() user: UserEntity) {
//     return this.taskService.findByUser(user.id);
//   }
}
