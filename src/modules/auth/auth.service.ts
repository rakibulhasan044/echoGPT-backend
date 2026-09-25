import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
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
}
