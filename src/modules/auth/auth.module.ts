import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
          secret: config.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
          signOptions: {
              expiresIn: config.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRATION') as any,
          },
      }),
      inject: [ConfigService],
  }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
