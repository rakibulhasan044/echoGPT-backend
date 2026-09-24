import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleDateFormatError(
  error: CustomDatabaseError,
  errorString: string,
  customMessage?: string,
): void {
  if (
    errorString.includes('invalid input syntax for type date') ||
    errorString.includes('date/time field value out of range') ||
    errorString.includes('timestamp')
  ) {
    throw new BadRequestException(customMessage || 'Invalid date format');
  }
}
