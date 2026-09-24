import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleAlreadyExistsError(
  error: CustomDatabaseError,
  errorString: string,
  customMessage?: string,
): void {
  if (errorString.includes('already exists')) {
    throw new BadRequestException(customMessage || 'Resource already exists');
  }
}
