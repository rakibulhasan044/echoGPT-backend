import { BadRequestException } from '@nestjs/common';
import { CustomDatabaseError } from '../../../types/error.type.js';

export function handleForeignKeyError(
  error: CustomDatabaseError,
  errorString: string,
  field: string | null,
  customMessage?: string,
): void {
  if (
    error.code === 'P2003' ||
    error.name === 'SequelizeForeignKeyConstraintError' ||
    errorString.includes('foreign key constraint') ||
    errorString.includes('violates foreign key constraint') ||
    errorString.includes('fk_') ||
    errorString.includes('violates foreign key') ||
    errorString.includes('is not present in table') ||
    errorString.includes('insert or update on table') ||
    errorString.includes('referenced relation') ||
    (errorString.includes('Key (') && errorString.includes(') is not present'))
  ) {
    throw new BadRequestException(
      customMessage ||
        `Invalid ${field || 'reference'}. The referenced record does not exist.`,
    );
  }
}
