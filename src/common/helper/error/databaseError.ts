import { Logger } from '@nestjs/common';
import { CustomDatabaseError } from '../../types/error.type.js';
import { handleForeignKeyError } from './handler/foreingKey.handler.js';
import { handleAlreadyExistsError } from './handler/alreadyExists.handler.js';
import { handleUniqueConstraintError } from './handler/uniqueConstraint.handler.js';
import { handleNotNullError } from './handler/notNull.handler.js';
import { handleDataTypeError } from './handler/dataType.handler.js';
import { handleDateFormatError } from './handler/dateFormat.handler.js';
import { handleEnumValidationError } from './handler/enumValidation.handler.js';
import { handleConnectionError } from './handler/connection.handler.js';
import { handleNotFoundError } from './handler/notFound.handler.js';

export class DatabaseErrorHandler {
  static handle(
    error: CustomDatabaseError,
    errorString: string,
    field: string | null,
    logger: Logger,
    customMessage?: string,
  ): void {
    handleNotFoundError(error, errorString, customMessage);
    handleForeignKeyError(error, errorString, field, customMessage);
    handleAlreadyExistsError(error, errorString, customMessage);
    handleUniqueConstraintError(error, errorString, field, customMessage);
    handleNotNullError(error, errorString, field, customMessage);
    handleDataTypeError(error, errorString, customMessage);
    handleDateFormatError(error, errorString, customMessage);
    handleEnumValidationError(error, errorString, customMessage);
    handleConnectionError(error, errorString, logger);
  }
}
