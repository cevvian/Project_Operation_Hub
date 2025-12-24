import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) { }

  private getFrontendUrl() {
    return (
      this.config.get<string>('APP_FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  async sendUserConfirmation(to: string, name: string, token?: string) {
    const appUrl = this.getFrontendUrl();
    const url = `${joinUrl(appUrl, '/auth/verify-email')}?token=${token}`;

    await this.mailerService.sendMail({
      to,
      subject: 'Xác nhận tài khoản của bạn',
      template: 'confirmation.hbs',
      context: {
        name,
        url,
      },
    });
  }

  async sendVerificationEmail(email: string, username: string, token: string) {
    const appUrl = this.getFrontendUrl();
    const verifyUrl = `${joinUrl(appUrl, '/auth/verify-email')}?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Xác thực tài khoản',
      html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Xác thực địa chỉ email</h2>
        <p>Xin chào <strong>${username}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2a9d8f; color: white; text-decoration: none;">Xác thực ngay</a>
        <p>Liên kết sẽ hết hạn sau 15 phút.</p>
      </div>
    `,
    });
  }

  async sendInviteEmail(email: string, username: string, teamName: string, token: string) {
    const appUrl = this.getFrontendUrl();
    const inviteUrl = `${joinUrl(appUrl, '/teams/join')}?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Bạn được mời vào team ' + teamName,
      template: 'invite-member.html',
      context: {
        username,
        teamName,
        url: inviteUrl,
      },
    });
  }

  async sendProjectInvitationEmail(to: string, inviterName: string, projectName: string, token: string) {
    const appUrl = this.getFrontendUrl();
    const inviteUrl = `${joinUrl(appUrl, '/accept-invitation')}?token=${token}`;

    await this.mailerService.sendMail({
      to,
      subject: `Invitation to join project: ${projectName}`,
      template: 'project-invitation.hbs', // We will create this template
      context: {
        inviterName,
        projectName,
        url: inviteUrl,
      },
    });
  }


  async sendPasswordResetEmail(email: string, username: string, token: string, autoLogin: boolean = false) {
    const appUrl = this.getFrontendUrl();
    let resetUrl = `${joinUrl(appUrl, '/auth/reset-password')}?token=${token}`;
    if (autoLogin) {
      resetUrl += '&autoLogin=true';
    }

    await this.mailerService.sendMail({
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      template: 'password-reset.hbs',
      context: {
        username,
        url: resetUrl,
      },
    });
  }

  async sendPlainText(to: string, subject: string, text: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      text,
    });
  }
}

