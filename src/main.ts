import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './common/setup/swagger.setup.js';
import { AllConfigType } from './common/types/config.type.js';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.enableCors();

  const configService = app.get(ConfigService<AllConfigType>);

  const nodeEnv = configService.get('app.nodeEnv', { infer: true });

  const port =
    configService.get('app.port', {
      infer: true,
    }) || 6001;

  const backendDomain =
    configService.get('app.backendDomain', {
      infer: true,
    }) || 'http://localhost';

  const apiPrefix =
    configService.getOrThrow('app.apiPrefix', {
      infer: true,
    }) || 'api';

  const domainWithPort = `${backendDomain}:${port}`;

  // Setup global configuration
  // setupGlobalConfig(app);

  setupSwagger(app);
  await app.listen(process.env.PORT ?? 6001);
}
await bootstrap();
