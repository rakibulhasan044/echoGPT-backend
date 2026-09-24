import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CustomDatabaseError } from '../types/error.type.js';
import { DatabaseErrorHandler } from './error/databaseError.js';

export class ErrorHandlerHelper {
  private static readonly logger = new Logger(ErrorHandlerHelper.name);

  /**
   * Simple error handler - just pass your custom message
   * It will handle database errors automatically and use your message when appropriate
   */
  static handleError(rawError: unknown, customMessage?: string): never {
    const error = (
      rawError instanceof Error ? rawError : new Error(String(rawError))
    ) as CustomDatabaseError;

    // Convert error to string for comprehensive checking
    const errorString = this.getErrorString(error);

    // Log the error
    this.logger.error(customMessage || 'Operation failed', error.stack);

    // If it's already a NestJS exception, throw it as-is
    if (
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof NotFoundException ||
      error instanceof UnauthorizedException ||
      error instanceof ForbiddenException
    ) {
      throw error;
    }

    const field = this.extractFieldFromError(error);

    // Delegate database-related errors to our new orchestrated handler
    DatabaseErrorHandler.handle(
      error,
      errorString,
      field,
      this.logger,
      customMessage,
    );

    // Default error with custom message
    throw new InternalServerErrorException(
      customMessage || 'Operation failed. Please try again.',
    );
  }

  /**
   * Convert error object to searchable string
   */
  private static getErrorString(rawError: unknown): string {
    const error = (
      rawError instanceof Error ? rawError : {}
    ) as CustomDatabaseError;
    const parts = [
      error.name || '',
      error.code || '',
      error.message || '',
      error.original?.message || '',
      error.parent?.message || '',
      error.sql || '',
      JSON.stringify(error.meta || {}),
      JSON.stringify(error.fields || {}),
    ];
    return parts.join(' ').toLowerCase();
  }

  /**
   * Extract field name from any database error
   */
  private static extractFieldFromError(rawError: unknown): string | null {
    try {
      const error = rawError as CustomDatabaseError;
      
      // Try to get from Prisma's meta
      if (error?.meta) {
        if (Array.isArray(error.meta.target)) {
          return error.meta.target.join(', ');
        }
        if (typeof error.meta.target === 'string') {
          return error.meta.target;
        }
        if (typeof error.meta.field_name === 'string') {
          return error.meta.field_name;
        }
      }

      // Try to get from legacy error.fields
      if (error?.fields && typeof error.fields === 'object') {
        return Object.keys(error.fields)[0] || null;
      }

      // Extract from error message
      if (error?.message && typeof error.message === 'string') {
        const patterns = [
          /Key \(([^)]+)\)=/,
          /column "([^"]+)"/,
          /constraint "([^"]+)"/,
          /"([^"]+)" cannot be null/,
          /null value in column "([^"]+)"/,
        ];

        for (const pattern of patterns) {
          const match = error.message.match(pattern);
          if (match) {
            return match[1];
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Handle async operation with error handling
   * Usage: await ErrorHandlerHelper.handleAsync(() => operation(), 'Failed to create user')
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    customMessage?: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      this.handleError(error, customMessage);
    }
  }

  /**
   * Validate DTO and throw error if validation fails
   * Usage: ErrorHandlerHelper.validateDto(createUserDto, ['email', 'name'])
   */
  static validateDto(
    dto: Record<string, unknown>,
    requiredFields: string[],
  ): void {
    const missingFields = requiredFields.filter((field) => !dto[field]);

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }
  }

  /**
   * Extract DTO validation errors
   */
  static handleDtoValidation(
    errors: Array<{ constraints?: Record<string, string> }>,
  ): never {
    const messages = errors.map((err) => {
      const constraints = err?.constraints;
      return Object.values(constraints || {}).join(', ');
    });

    throw new BadRequestException(messages.join('; '));
  }
}
