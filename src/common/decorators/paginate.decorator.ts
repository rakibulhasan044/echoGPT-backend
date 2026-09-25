import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface PaginateParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
}

export interface PaginateResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const Paginate = createParamDecorator(
  (
    options: {
      limit?: number;
      maxLimit?: number;
    } = {},
    ctx: ExecutionContext,
  ): PaginateParams => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const query = request.query;

    const page = Math.max(1, parseInt((query.page as string) || '1') || 1);
    const limit = Math.min(
      options.maxLimit || 100,
      Math.max(
        1,
        parseInt((query.limit as string) || String(options.limit || 10)) || 10,
      ),
    );
    const skip = (page - 1) * limit;
    const search =
      typeof query.search === 'string' ? query.search.trim() : undefined;

    return { page, limit, skip, search };
  },
);
