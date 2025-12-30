import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'], // Yêu cầu quyền truy cập email của người dùng
      passReqToCallback: true, // Enable access to request object in validate callback
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any, info?: any) => void): Promise<any> {
    // Sau khi GitHub xác thực thành công, hàm này sẽ được gọi.
    // Chúng ta sẽ lấy thông tin cần thiết từ profile và trả về.
    const { username, emails, photos, displayName } = profile;
    const user = {
      email: emails?.[0]?.value,
      name: displayName || username,
      githubName: username,
      avatar: photos?.[0]?.value,
      accessToken, // Lưu lại token để có thể thực hiện các tác vụ khác sau này nếu cần
    };
    done(null, user);
  }
}

