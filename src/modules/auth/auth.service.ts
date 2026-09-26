import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './application/token.service.js';
import { SessionService } from './application/session.service.js';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpPolicy } from './domain/otp.policy.js';
import { MailService } from '../mail/mail.service.js';
import { createHash } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpPolicy: OtpPolicy,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    // 1. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('This email address is already registered.');
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // 3. Create the user inside a transaction along with the OTP
      const user = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName,
            isEmailVerified: false,
            subscription: {
              create: {
                planName: 'FREE',
                status: 'ACTIVE',
                requestLimit: 3,
                requestsUsed: 0,
              }
            }
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        // 4. Generate OTP
        const code = this.otpPolicy.generateOtp();
        const expiresAt = this.otpPolicy.getExpiresAt();
        
        // Hash the OTP before saving it
        const codeHash = createHash('sha256').update(code).digest('hex');

        // Delete any existing OTPs for this email just in case
        await tx.otp.deleteMany({
          where: { email },
        });

        // Create OTP record
        await tx.otp.create({
          data: {
            email,
            codeHash,
            expiresAt,
          },
        });

        // 5. Send the plain OTP code via Email
        await this.mailService.sendOtpEmail(email, code);
        
        return newUser;
      });

      return user;
    } catch (error) {
      throw new InternalServerErrorException('Registration failed. Please try again later.');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid email or verification code.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: { email },
    });

    if (!otpRecord) {
      throw new BadRequestException('Verification code expired or not found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.prisma.otp.delete({ where: { id: otpRecord.id } });
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    // Check attempt limit
    this.otpPolicy.assertCanAttempt(otpRecord.attemptCount);

    const codeHash = createHash('sha256').update(code).digest('hex');
    
    if (otpRecord.codeHash !== codeHash) {
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attemptCount: { increment: 1 } },
      });
      throw new BadRequestException('Invalid verification code.');
    }

    // Success! Verify the user and delete the OTP
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      }),
      this.prisma.otp.delete({
        where: { id: otpRecord.id },
      })
    ]);

    // Issue tokens so they are automatically logged in
    const tokens = await this.sessionService.issueTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Ensure account is active
    if (!user.isActive) {
      throw new UnauthorizedException('your account has been restricted .conatct admin');
    }

    // Ensure email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in.');
    }

    // Issue tokens
    const tokens = await this.sessionService.issueTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  async resendVerificationOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether user exists or not for security reasons, just return generic success message
      return null;
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Delete any existing OTPs for this email to invalidate old codes
        await tx.otp.deleteMany({
          where: { email },
        });

        // Generate fresh OTP
        const code = this.otpPolicy.generateOtp();
        const expiresAt = this.otpPolicy.getExpiresAt();
        const codeHash = createHash('sha256').update(code).digest('hex');

        // Create new OTP record
        await tx.otp.create({
          data: {
            email,
            codeHash,
            expiresAt,
          },
        });

        // Send the new code via Email
        await this.mailService.sendOtpEmail(email, code);
      });

      return null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to resend verification code. Please try again later.');
    }
  }

  async logout(logoutDto: LogoutDto, userId: string) {
    await this.sessionService.revokeByRefreshToken(logoutDto.refreshToken, userId);
    return null;
  }

  async logoutAll(userId: string) {
    await this.sessionService.revokeAllUserSessions(userId);
    return null;
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const session = await this.sessionService.findByRefreshToken(refreshToken);
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token. Please sign in again.');
    }

    // Ensure the user account is active
    if (!session.user.isActive) {
      throw new UnauthorizedException('This account has been disabled.');
    }

    // Rotate the refresh token
    const newRefreshToken = await this.sessionService.rotateRefreshSession({
      sessionId: session.id,
      userId: session.userId,
    });

    // Create a new access token
    const newAccessToken = await this.tokenService.generateAccessToken({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

