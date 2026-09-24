import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorHandlerHelper } from '../helper/errorMessage.helper.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    try {
      // Pass it to the helper, which will translate database errors
      // and throw standard NestJS HttpExceptions
      ErrorHandlerHelper.handleError(exception);
    } catch (translatedException) {
      if (translatedException instanceof HttpException) {
        const status = translatedException.getStatus();
        const exceptionResponse = translatedException.getResponse();

        response.status(status).json({
          success: false,
          ...(typeof exceptionResponse === 'object'
            ? exceptionResponse
            : {
                statusCode: status,
                message: exceptionResponse,
              }),
        });
      } else {
        // Fallback for completely unknown/unhandled errors
        this.logger.error('Unhandled exception', String(translatedException));
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
      }
    }
  }
}
