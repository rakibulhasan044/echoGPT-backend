import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { AppConfig } from '../common/types/appConfig.type.js';
import validateConfig from './validate.config.js';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  APP_PORT?: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_DOMAIN?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN?: string;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsBoolean()
  @IsOptional()
  HEALTH_CHECK_ENABLED?: boolean;

  @IsString()
  @IsOptional()
  SWAGGER_PATH?: string;

  @IsString()
  @IsOptional()
  PERFORMANCE_WARNING_THRESHOLD?: string;

  // JWT
  @IsString()
  @IsOptional()
  JWT_ACCESS_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN_DAYS?: string;

  // Mail
  @IsString()
  @IsOptional()
  MAIL_PASS?: string;

  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @IsInt()
  @IsOptional()
  MAIL_PORT?: number;

  @IsString()
  @IsOptional()
  MAIL_USER?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  // OTP
  @IsString()
  @IsOptional()
  OTP_SECRET?: string;

  @IsInt()
  @IsOptional()
  OTP_MAX_ATTEMPT?: number;

  @IsInt()
  @IsOptional()
  OTP_EXPIRES_IN_MINS?: number;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    frontendDomain: process.env.FRONTEND_DOMAIN,
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 6001,
    apiPrefix: process.env.API_PREFIX || 'api',
    swaggerPath: process.env.SWAGGER_PATH || 'docs',
    healthCheckEnabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    performanceWarningThreshold: process.env.PERFORMANCE_WARNING_THRESHOLD,

    // JWT
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    jwtRefreshExpiresInDays: process.env.JWT_REFRESH_EXPIRES_IN_DAYS,

    // Mail
    mailPass: process.env.MAIL_PASS,
    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    mailUser: process.env.MAIL_USER,
    mailFrom: process.env.MAIL_FROM,

    // OTP
    otpSecret: process.env.OTP_SECRET,
    otpMaxAttempt: process.env.OTP_MAX_ATTEMPT ? parseInt(process.env.OTP_MAX_ATTEMPT, 10) : 5,
    otpExpiresInMins: process.env.OTP_EXPIRES_IN_MINS ? parseInt(process.env.OTP_EXPIRES_IN_MINS, 10) : 10,
  };
});
