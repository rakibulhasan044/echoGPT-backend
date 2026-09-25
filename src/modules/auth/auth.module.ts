import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';
import { OtpPolicy } from './domain/otp.policy.js';
import { OtpCleanupService } from './application/otp-cleanup.service.js';
import { TokenService } from './application/token.service.js';
import { SessionService } from './application/session.service.js';
import { JwtStrategy } from '../../common/strategies/jwt.strategy.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtAccessSecret'),
        signOptions: { 
          expiresIn: (configService.get<string>('app.jwtAccessExpiresIn') || '15m') as any 
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    OtpPolicy,
    OtpCleanupService,
    TokenService,
    SessionService,
    JwtStrategy,
  ],
})
export class AuthModule {}
