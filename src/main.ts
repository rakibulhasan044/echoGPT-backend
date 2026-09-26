import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module.js';
import { AllConfigType } from './common/types/config.type.js';
import { setupGlobalConfig } from './common/setup/global.setup.js';
import { setupSwagger } from './common/setup/swagger.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe Webhook Signature Verification
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService<AllConfigType>);

  const nodeEnv = configService.get('app.nodeEnv', {
    infer: true,
  });

  const port =
    configService.get('app.port', {
      infer: true,
    }) ?? 6001;

  const backendDomain =
    configService.get('app.backendDomain', {
      infer: true,
    }) ?? 'http://localhost';

  const apiPrefix = configService.getOrThrow('app.apiPrefix', {
    infer: true,
  });

  const domainWithPort = backendDomain.includes(`:${port}`) ? backendDomain : (backendDomain.includes('localhost') || /^https?:\/\/(\d{1,3}\.){3}\d{1,3}$/.test(backendDomain) ? `${backendDomain}:${port}` : backendDomain);

  // Global configuration
  setupGlobalConfig(app);

  // Cookies
  app.use(cookieParser());

  // CORS
  app.enableCors();

  // Swagger
  setupSwagger(app);

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);

    try {
      await app.close();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  await app.listen(port, '0.0.0.0');

  console.log(`Server is running on: ${domainWithPort}`);

  if (nodeEnv !== 'production') {
    console.log(
      `Swagger documentation: ${domainWithPort}/${apiPrefix}/v1/docs`,
    );
    console.log(`Environment: ${nodeEnv}`);
  }
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
