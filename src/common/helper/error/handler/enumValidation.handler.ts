import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleEnumValidationError(
  error: CustomDatabaseError,
  errorString: string,
  customMessage?: string,
): void {
  if (
    errorString.includes('invalid input value for enum') ||
    errorString.includes('must be one of')
  ) {
    throw new BadRequestException(customMessage || 'Invalid value provided');
  }
}
