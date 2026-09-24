import { ConflictException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleUniqueConstraintError(
  error: CustomDatabaseError,
  errorString: string,
  field: string | null,
  customMessage?: string,
): void {
  if (
    error.code === 'P2002' ||
    error.name === 'SequelizeUniqueConstraintError' ||
    errorString.includes('SequelizeUniqueConstraintError') ||
    errorString.includes('duplicate key value') ||
    errorString.includes('violates unique constraint') ||
    errorString.includes('unique_') ||
    errorString.includes('UNIQUE constraint')
  ) {
    throw new ConflictException(
      customMessage || `This ${field || 'value'} already exists`,
    );
  }
}
