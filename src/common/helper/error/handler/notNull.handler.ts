import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleNotNullError(
  error: CustomDatabaseError,
  errorString: string,
  field: string | null,
  customMessage?: string,
): void {
  if (
    error.code === 'P2011' ||
    error.code === 'P2012' ||
    error.name === 'SequelizeValidationError' ||
    errorString.includes('violates not-null constraint') ||
    errorString.includes('cannot be null') ||
    errorString.includes('notNull Violation') ||
    errorString.includes('null value in column')
  ) {
    throw new BadRequestException(
      customMessage || `Required field ${field || ''} is missing`,
    );
  }
}
