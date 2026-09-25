import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run every night at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Starting cleanup of expired OTPs...');
    try {
      const result = await this.prisma.otp.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      this.logger.log(`Successfully deleted ${result.count} expired OTP(s).`);
    } catch (error) {
      this.logger.error('Failed to clean up expired OTPs', error);
    }
  }
}
