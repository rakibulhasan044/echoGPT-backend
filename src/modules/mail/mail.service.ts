import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('app.mailHost'),
      port: this.configService.get<number>('app.mailPort'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('app.mailUser'),
        pass: this.configService.get<string>('app.mailPass'),
      },
    });
  }

  async sendOtpEmail(to: string, code: string) {
    const from = this.configService.get<string>('app.mailFrom') || 'noreply@echogpt.com';
    
    try {
      await this.transporter.sendMail({
        from: `"EchoGPT" <${from}>`,
        to,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to EchoGPT!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      throw new Error('Failed to send verification email.');
    }
  }
}
