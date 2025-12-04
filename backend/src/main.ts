import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - support multiple origins with wildcard patterns
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin matches any allowed pattern (including wildcards)
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        // Convert wildcard pattern to regex
        const pattern = allowedOrigin
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Motel Management API')
    .setDescription(
      'API for managing motel suites, tasks, employees, and operations',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Suites', 'Suite management')
    .addTag('Tasks', 'Task management')
    .addTag('Employees', 'Employee management')
    .addTag('Notes', 'Notes and communications')
    .addTag('Notifications', 'User notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
