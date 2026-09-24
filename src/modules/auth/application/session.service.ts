import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { JwtPayload } from "../../../common/strategies/jwt.strategy.js";
import { TokenService } from "./token.service.js";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async issueTokenPair(payload: JwtPayload) {
    const tokens = await this.tokenService.createTokenPair(payload);

    await this.prisma.session.create({
      data: {
        userId: payload.sub,
        refreshToken: this.tokenService.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
      }
    });

    return tokens;
  }

  async findByRefreshToken(refreshToken: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: this.tokenService.hashRefreshToken(refreshToken),
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return null;
    }

    return session;
  }

  async revokeSession(sessionId: string) {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async rotateRefreshSession(command: {
    sessionId: string;
    userId: string;
  }) {
    const refreshToken = this.tokenService.generateRefreshToken();

    await this.prisma.$transaction(async (tx) => {
      const revokedSession = await tx.session.updateMany({
        where: {
          id: command.sessionId,
          isRevoked: false,
        },
        data: {
          isRevoked: true,
        },
      });

      if (revokedSession.count !== 1) {
        throw new UnauthorizedException(
          "This refresh token has already been used or revoked, so it cannot be rotated again safely. Please sign in again to create a new session.",
        );
      }

      await tx.session.create({
        data: {
          userId: command.userId,
          refreshToken: this.tokenService.hashRefreshToken(refreshToken),
          expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
        }
      });
    });

    return refreshToken;
  }

  async revokeByRefreshToken(refreshToken: string, userId?: string) {
    await this.prisma.session.updateMany({
      where: {
        refreshToken: this.tokenService.hashRefreshToken(refreshToken),
        isRevoked: false,
        ...(userId ? { userId } : {}),
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async revokeAllUserSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }
}
