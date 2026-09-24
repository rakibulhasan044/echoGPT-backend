import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleDataTypeError(
  error: CustomDatabaseError,
  errorString: string,
  customMessage?: string,
): void {
  if (
    error.code === 'P2006' ||
    error.code === 'P2023' ||
    error.name === 'PrismaClientValidationError' ||
    errorString.includes('invalid input syntax') ||
    errorString.includes('invalid value') ||
    errorString.includes('cannot cast') ||
    errorString.includes('invalid text representation')
  ) {
    throw new BadRequestException(customMessage || 'Invalid data format');
  }
}
