import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Req, Query, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';
import { Public } from './guard/auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { User } from './decorator/user.decorator';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
  ) { }

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

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email, forgotPasswordDto.source);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 login flow' })
  githubAuth() {
    // Passport will handle the redirection to GitHub.
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Handle GitHub OAuth2 callback' })
  githubAuthCallback(@Req() req) {
    // The user profile is attached to req.user by the GithubStrategy's validate method.
    return this.authService.loginWithGithub(req.user);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login flow' })
  googleAuth() {
    // Passport will handle the redirection to Google.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Handle Google OAuth2 callback' })
  googleAuthCallback(@Req() req) {
    return this.authService.loginWithGoogle(req.user);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);
    return { message: 'Verification email has been resent. Please check your inbox.' };
  }


  @Get('profile')
  getProfile(@User('sub') userId: string) {
    return this.userService.findOne(userId)
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user password for sensitive actions' })
  async verifyPassword(@User() user: any, @Body() body: { password: string }) {
    try {
      await this.userService.validate(user.email, body.password);
      return { success: true };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new ForbiddenException('Incorrect password');
      }
      throw error;
    }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(@User('sub') userId: string, @Body() dto: ChangePasswordDto) {
    try {
      await this.authService.changePassword(userId, dto);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new ForbiddenException('Incorrect old password');
      }
      throw error;
    }
  }
}
