import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllConfigType } from '../types/config.type.js';

function resolveBaseUrl(backendDomain: string, port: number): string {
  const cleanedDomain = backendDomain.replace(/\/+$/, '');

  if (cleanedDomain.includes(`:${port}`)) {
    return cleanedDomain;
  }

  const isLocalhost = cleanedDomain.includes('localhost');
  const isIpAddress = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}$/.test(cleanedDomain);

  return isLocalhost || isIpAddress
    ? `${cleanedDomain}:${port}`
    : cleanedDomain;
}

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService<AllConfigType>);
  const nodeEnv = configService.get('app.nodeEnv', { infer: true });

  if (nodeEnv === 'production') return;

  const apiPrefix = configService.get('app.apiPrefix', { infer: true }) || 'api';
  const port = configService.get('app.port', { infer: true }) || 5000;
  const backendDomain =
    configService.get('app.backendDomain', { infer: true }) || 'http://localhost';

  const baseUrl = resolveBaseUrl(backendDomain, port);
  console.log('Final Swagger Base URL:', baseUrl);

  const config = new DocumentBuilder()
    .setTitle('echoGPT Backend API')
    .setDescription('Comprehensive API documentation for echoGPT Backend application')
    .setVersion('1.0.0')
    .addServer(baseUrl, 'Development Server')
    .addServer('http://localhost:6001', 'Local Network Server')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
    ignoreGlobalPrefix: false,
  });

  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'echoGPT API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2563EB }
    `,
    customfavIcon: '/favicon.ico',
  };

  const swaggerPath = `${apiPrefix}/v1/docs`.replace(/^\/+/, '');
  SwaggerModule.setup(swaggerPath, app, document, swaggerOptions);

  console.log(`Swagger documentation configured at: /${swaggerPath}`);
  console.log(`Swagger JSON available at: /${swaggerPath}-json`);
}