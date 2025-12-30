import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/database/entities/user.entity';
import { UserStatus } from 'src/database/entities/enum/user-status.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { EmailService } from '../email/email.service';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) { }

  async signIn(dto: LoginUserDto) {
    const user = await this.userService.validate(dto.email, dto.password);

    const { accessToken, refreshToken } = await this.generateToken(user);
    // await this.saveToken(user.id, accessToken, refreshToken);

    return { accessToken, refreshToken };
  }

  async changePassword(userId: string, dto: { oldPassword: string, newPassword: string }) {
    const user = await this.userService.findOne(userId);
    await this.userService.validate(user.email, dto.oldPassword);
    // If validate does not throw, passwords match. We can update.
    return this.userService.update(userId, { password: dto.newPassword });
  }

  async register(data: CreateUserDto) {
    const user = await this.userService.create(data);

    // If sign-up comes from an invitation link, activate immediately (skip email verification)
    if (data.invitation_token) {
      if (user.status !== UserStatus.ACTIVE) {
        await this.userService.verifyAccount(user.id);
      }
      return { message: 'Account created via invitation. You can sign in now.' };
    }

    // Normal flow: require email verification
    if (user.status !== UserStatus.ACTIVE) {
      const token = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.getOrThrow<string>('JWT_EMAIL_VERIFICATION_SECRET'),
          expiresIn: '15m',
        },
      );
      await this.emailService.sendVerificationEmail(user.email, user.name, token);
      return {
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      };
    }

    // Existing verified user trying to register again
    throw new AppException(ErrorCode.ACCOUNT_ALREADY_REGISTERED);
  }

  async verifyEmail(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow('JWT_EMAIL_VERIFICATION_SECRET'),
    }).catch(() => {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    });

    const user = await this.userService.findOne(payload.sub);

    if (user.status === UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.ALREADY_VERIFIED);
    }

    await this.userService.verifyAccount(user.id);

    return {
      message: 'Email xác thực thành công.'
    };
  }

  async forgotPassword(email: string, source?: string) {
    const user = await this.userService.findUserByEmail(email).catch(() => null);

    // To prevent email enumeration attacks, we don't reveal if the user was found or not.
    if (user) {
      const token = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
          secret: this.configService.getOrThrow<string>('JWT_PASSWORD_RESET_SECRET'),
          expiresIn: '15m',
        },
      );
      const autoLogin = source === 'profile';
      await this.emailService.sendPasswordResetEmail(user.email, user.name, token, autoLogin);
    }

    return {
      message: 'Nếu tài khoản của bạn tồn tại, một email hướng dẫn đặt lại mật khẩu đã được gửi đi.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_PASSWORD_RESET_SECRET'),
      });
    } catch {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    }

    const user = await this.userService.findOne(payload.sub);
    await this.userService.update(user.id, { password: newPassword });

    // Generate tokens for potential auto-login
    const tokens = await this.generateToken(user);

    return {
      message: 'Mật khẩu đã được đặt lại thành công.',
      ...tokens,
    };
  }


  async generateToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRATION') as any,
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
    });

    return { accessToken, refreshToken };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      // To prevent email enumeration, we don't reveal if the user exists.
      return;
    }

    if (user.status === UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.ALREADY_VERIFIED);
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow<string>('JWT_EMAIL_VERIFICATION_SECRET'),
        expiresIn: '15m',
      },
    );

    await this.emailService.sendVerificationEmail(user.email, user.name, token);
  }

  async loginWithGithub(userFromGithub: any) {
    let user = await this.userService.findUserByEmail(userFromGithub.email).catch(() => null);

    if (!user) {
      user = await this.userService.create({
        email: userFromGithub.email,
        name: userFromGithub.name,
        githubName: userFromGithub.githubName,
        avatar: userFromGithub.avatar,
        password: null, // No password for social login
      } as any);

      // Verify/Activate new social users immediately
      await this.userService.verifyAccount(user.id);
    } else {
      // Update existing user info if needed
      if (!user.githubName) {
        user = await this.userService.update(user.id, { githubName: userFromGithub.githubName });
      }
    }
    // Ensure social login users are active appropriately?
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.UNVERIFIED) {
      // ie. LOCKED
      throw new AppException(ErrorCode.USER_INACTIVE);
    }
    if (user.status === UserStatus.UNVERIFIED) {
      await this.userService.verifyAccount(user.id);
    }


    return this.generateToken(user);
  }

  async loginWithGoogle(userFromGoogle: any) {
    let user = await this.userService.findUserByEmail(userFromGoogle.email).catch(() => null);

    if (!user) {
      user = await this.userService.create({
        email: userFromGoogle.email,
        name: userFromGoogle.name,
        googleId: userFromGoogle.googleId,
        avatar: userFromGoogle.avatar,
        password: null,
      } as any)
      await this.userService.verifyAccount(user.id);
    } else {
      if (!user.googleId) {
        user = await this.userService.update(user.id, { googleId: userFromGoogle.googleId });
      }
    }

    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.UNVERIFIED) {
      throw new AppException(ErrorCode.USER_INACTIVE);
    }
    if (user.status === UserStatus.UNVERIFIED) {
      await this.userService.verifyAccount(user.id);
    }

    return this.generateToken(user);
  }

  async connectGithubToUser(userId: string, githubName: string): Promise<void> {
    await this.userService.connectGithubAccount(userId, githubName);
  }

  getGithubConnectUrl(userId: string): string {
    const clientId = this.configService.getOrThrow<string>('GITHUB_CLIENT_ID');
    const callbackUrl = this.configService.getOrThrow<string>('GITHUB_CALLBACK_URL');
    const scope = 'user:email';
    const state = `connect:${userId}`;
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}&state=${encodeURIComponent(state)}`;
  }
}
