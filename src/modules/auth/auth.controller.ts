import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Req, Res, Query, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
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
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
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

  /**
   * Initiate GitHub connect flow for already authenticated users.
   * This manually redirects to GitHub OAuth with state containing userId.
   */
  @Get('github/connect')
  @ApiOperation({ summary: 'Initiate GitHub OAuth2 connect flow (for existing users)' })
  async githubConnect(@Query('userId') userId: string, @Res() res) {
    if (!userId) {
      return res.redirect('/auth/github'); // Fallback to normal login
    }

    const githubAuthUrl = this.authService.getGithubConnectUrl(userId);
    return res.redirect(githubAuthUrl);
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Handle GitHub OAuth2 callback - supports both login and connect flows' })
  async githubAuthCallback(@Req() req, @Res() res) {
    const frontendUrl = this.configService.get('APP_FRONTEND_URL') || 'http://localhost:3000';
    const githubProfile = req.user;

    // Parse state parameter - format: "connect:userId" for connect flow
    const state = req.query.state as string || '';

    if (state.startsWith('connect:')) {
      // Connect flow: Link GitHub to existing account
      const userId = state.replace('connect:', '');
      if (userId) {
        await this.authService.connectGithubToUser(userId, githubProfile.githubName);
        return res.redirect(`${frontendUrl}/user/profile?github_connected=true`);
      }
    }

    // Login flow: Create/find user and return tokens
    const tokens = await this.authService.loginWithGithub(req.user);
    return res.redirect(`${frontendUrl}/auth/github/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
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
  async googleAuthCallback(@Req() req, @Res() res) {
    const tokens = await this.authService.loginWithGoogle(req.user);
    const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/auth/google/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
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
