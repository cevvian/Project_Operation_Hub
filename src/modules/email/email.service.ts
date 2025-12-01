import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';


@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendUserConfirmation(to: string, name: string, token?: string) {
    const url = `https://localhost:5000/auth/verify-email?token=${token}`;
    // const url = `http://localhost:5000/api#/`; 

    await this.mailerService.sendMail({
      to,
      subject: 'Xác nhận tài khoản của bạn',
      template: 'confirmation.hbs', // file templates/confirmation.hbs
      context: {
        name,
        url,
      },
    });
  }

  async sendVerificationEmail(email: string, username: string, token: string) {
    const verifyUrl = `http://localhost:5000/auth/verify-email?token=${token}`;
    // const verifyUrl = `http://localhost:5000/api`;

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
    // const templatePath = path.join(__dirname, 'templates', 'invite-member.html');
    // let html = fs.readFileSync(templatePath, 'utf-8');

    const inviteUrl = `https://your-app.com/teams/join?token=${token}`;

    // html = html
    //   .replace('{{username}}', username)
    //   .replace('{{teamName}}', teamName)
    //   .replace('{{inviteUrl}}', inviteUrl);

    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: `Invitation to join team ${teamName}`,
    //   html,
    // });

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

  // Gửi email text thuần
  async sendPlainText(to: string, subject: string, text: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      text,
    });
  }
}