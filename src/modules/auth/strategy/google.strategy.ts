import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, profile: Profile, done: (error: any, user?: any, info?: any) => void): Promise<any> {
    const { id, name, emails, photos, displayName } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      name: (name && name.givenName && name.familyName) ? `${name.givenName} ${name.familyName}` : displayName || emails?.[0]?.value,
      avatar: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}

