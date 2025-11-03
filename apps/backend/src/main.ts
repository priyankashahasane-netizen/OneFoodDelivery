import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  const swagger = new DocumentBuilder()
    .setTitle('Stack Delivery API')
    .setDescription('APIs for orders, drivers, routes, geo and tracking')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('http.port', 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Backend API listening on port ${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start backend', error);
  process.exit(1);
});

