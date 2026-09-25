import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
};

export type CurrentUserPayload = {
  id: string;
  fullName: string | null;
  email: string;
  role: Role;
  isActive: boolean;
};

export type AuthenticatedRequest = Request & {
  user: CurrentUserPayload;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken || ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        },
      ]),
      secretOrKey: (configService.get<string>('app.jwtAccessSecret') || process.env.JWT_ACCESS_SECRET) as string,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'The access token is missing, expired, malformed, or belongs to a user account that no longer exists. Please sign in again to get a fresh token.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'This account cannot use the API because its current status is inactive. Please complete the required activation steps or contact an administrator before trying again.',
      );
    }

    if (payload.role !== user.role) {
      throw new UnauthorizedException(
        'The access token does not match the current user account role. Please sign in again so the API receives a token with the correct account context.',
      );
    }

    return user;
  }
}
