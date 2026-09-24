import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';

export interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const decoratorMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((res: unknown) => {
        const defaultMessage = decoratorMessage || 'Operation successful';

        // 1. Check if the response is a standard JavaScript object
        if (res && typeof res === 'object') {
          // Cast safely to a Record so we can check properties without ESLint unsafe-member-access
          const responseObj = res as Record<string, unknown>;

          // 2. Handle pagination responses where data and meta are returned
          if ('data' in responseObj && 'meta' in responseObj) {
            return {
              success: true,
              message: (responseObj.message as string) || defaultMessage,
              data: responseObj.data as T,
              meta: responseObj.meta as StandardResponse<T>['meta'],
            };
          }

          // 3. Handle standard flat responses (like returning an object directly)
          return {
            success: true,
            message: (responseObj.message as string) || defaultMessage,
            data: (responseObj.data !== undefined
              ? responseObj.data
              : responseObj) as T,
          };
        }

        // 4. Fallback for primitives (strings, numbers, etc.)
        return {
          success: true,
          message: defaultMessage,
          data: (res ?? null) as T,
        };
      }),
    );
  }
}
