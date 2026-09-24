import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '../../generated/prisma/enums.js';
import { AuthenticatedRequest } from '../strategies/jwt.strategy.js';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Access denied. You must be an administrator to access this resource.',
      );
    }

    return true;
  }
}
