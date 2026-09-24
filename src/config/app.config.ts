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
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'app',
    workingDirectory: process.env.PWD || process.cwd(),
    backendDomain: process.env.BACKEND_DOMAIN ?? 'http://localhost',
    port: process.env.APP_PORT
      ? parseInt(process.env.APP_PORT, 10)
      : process.env.PORT
        ? parseInt(process.env.PORT, 10)
        : 6001,
    apiPrefix: process.env.API_PREFIX || 'api',
    swaggerPath: process.env.SWAGGER_PATH || 'docs',
  };
});
