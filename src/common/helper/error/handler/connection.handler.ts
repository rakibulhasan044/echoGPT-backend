import { InternalServerErrorException, Logger } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleConnectionError(
  error: CustomDatabaseError,
  errorString: string,
  logger: Logger,
): void {
  if (
    error.code === 'P1001' ||
    error.code === 'P1017' ||
    error.name === 'PrismaClientInitializationError' ||
    errorString.includes('connection') ||
    errorString.includes('ECONNREFUSED') ||
    errorString.includes('timeout') ||
    errorString.includes('ETIMEDOUT')
  ) {
    logger.error('Database connection error', error.stack);
    throw new InternalServerErrorException(
      'Database connection error. Please try again later.',
    );
  }
}
