import { createHash, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

import { JwtPayload } from "../../../common/strategies/jwt.strategy.js";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: JwtPayload) {
    const secret = this.configService.get<string>('app.jwtAccessSecret');
    return this.jwt.signAsync(payload, { secret });
  }

  generateRefreshToken() {
    return randomBytes(64).toString("hex");
  }

  hashRefreshToken(refreshToken: string) {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  getRefreshTokenExpiresAt() {
    const rawDays = this.configService.get<string>('app.jwtRefreshExpiresInDays') || '30d';
    
    // Parse "30d" into 30
    const match = rawDays.match(/(\d+)/);
    const days = match ? Number(match[1]) : 30;

    if (!Number.isInteger(days) || days <= 0) {
      throw new Error("JWT_REFRESH_EXPIRES_IN_DAYS must be a positive integer");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    return expiresAt;
  }

  async createTokenPair(payload: JwtPayload) {
    return {
      accessToken: await this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(),
    };
  }
}
