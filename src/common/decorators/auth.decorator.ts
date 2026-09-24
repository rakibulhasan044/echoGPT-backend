import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../generated/prisma/enums.js';

export type CurrentUserPayload = {
  id: string;
  fullName: string | null;
  email: string;
  role: Role;
  isActive: boolean;
};

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: CurrentUserPayload }>();
    const user = request.user;

    if (data && user) {
      return user[data];
    }
    return user;
  },
);
