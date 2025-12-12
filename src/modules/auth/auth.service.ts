import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/database/entities/user.entity';
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
  ){}

  async signIn(dto: LoginUserDto) {
    const user = await this.userService.validate(dto.email, dto.password);

    const { accessToken, refreshToken } = await this.generateToken(user);
    // await this.saveToken(user.id, accessToken, refreshToken);

    return { accessToken, refreshToken };
  }

  async register(data: CreateUserDto) {
    const user = await this.userService.create(data);

    if(!user.isVerified){
      const token = await this.jwtService.signAsync(
        { sub: user.id, email: user.email },
        {
            secret: this.configService.getOrThrow<string>('JWT_EMAIL_VERIFICATION_SECRET'),
            expiresIn: '15m',
        },
      );
      await this.emailService.sendVerificationEmail(user.email, user.name, token);
    }
    else throw new AppException(ErrorCode.ACCOUNT_ALREADY_REGISTERED)

    return {
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  }

  async verifyEmail(token: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow('JWT_EMAIL_VERIFICATION_SECRET'),
      }).catch(() => {
          throw new AppException(ErrorCode.INVALID_TOKEN);
    });

    const user = await this.userService.findOne(payload.sub);

    if (user.isVerified) {
        throw new AppException(ErrorCode.ALREADY_VERIFIED);
    }

    await this.userService.verifyAccount(user.id);

    return {
        message: 'Email xác thực thành công.'
    };
  }

  // https://grok.com/share/bGVnYWN5_7cb25013-b6e6-4213-811d-1645fa5aceef
  async resendVerificationEmail(email: string) {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    if (user.isVerified) {
      throw new AppException(ErrorCode.ALREADY_VERIFIED);
    }

    // Check rate limit (tối đa 3 lần/giờ)
    // const now = new Date();
    // const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // const recentResends = await this.userService.countResendAttempts(
    //   user.id,
    //   oneHourAgo
    // );

    // if (recentResends >= 3) {
    //   throw new AppException(ErrorCode.TOO_MANY_VERIFICATION_EMAILS);
    // }

    // Tạo token mới
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.getOrThrow('JWT_EMAIL_VERIFICATION_SECRET'),
        expiresIn: '15m',
      },
    );

    // Gửi email & log attempt
    await this.emailService.sendVerificationEmail(user.email, user.name, token);

    // await this.userService.logResendAttempt(user.id);

    return {
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.',
    };
  }

  async forgotPassword(email: string) {
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
      await this.emailService.sendPasswordResetEmail(user.email, user.name, token);
    }

    return {
      message: 'Nếu tài khoản của bạn tồn tại, một email hướng dẫn đặt lại mật khẩu đã được gửi đi.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow('JWT_PASSWORD_RESET_SECRET'),
    }).catch(() => {
      throw new AppException(ErrorCode.INVALID_TOKEN);
    });

    const user = await this.userService.findOne(payload.sub);
    await this.userService.updatePassword(user.id, newPassword);

    return {
      message: 'Mật khẩu đã được đặt lại thành công.',
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
}
