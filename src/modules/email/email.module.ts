import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailController } from './email.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';

const templateDirDev = join(process.cwd(), 'src', 'modules', 'email', 'templates');
const templateDirProd = join(process.cwd(), 'dist', 'modules', 'email', 'templates');

@Module({
  imports: [
    ConfigModule, // ensure ConfigService available
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const user = config.get<string>('SMTP_USER');
        const pass = config.get<string>('SMTP_PASSWORD');
        if (!user || !pass) {
          throw new Error('SMTP credentials missing (SMTP_USER or SMTP_PASSWORD)');
        }

        const dir = process.env.NODE_ENV === 'production' ? templateDirProd : templateDirDev;
        if (!existsSync(dir)) {
          console.warn('Email templates directory not found:', dir);
        }

        return {
          transport: {
            host: config.get<string>('SMTP_HOST') || 'smtp.gmail.com',
            port: Number(config.get<number>('SMTP_PORT') || 587),
            secure: false,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: `"Dev Flow" <${user}>`,
          },
          template: {
            dir,
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}