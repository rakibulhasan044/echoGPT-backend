import { NotFoundException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleNotFoundError(
  error: CustomDatabaseError,
  errorString: string,
  customMessage?: string,
): void {
  if (
    error.code === 'P2025' ||
    (error.name === 'PrismaClientKnownRequestError' && error.message?.includes('not found'))
  ) {
    throw new NotFoundException(
      customMessage || (error.meta?.cause as string) || 'Record not found',
    );
  }
}
