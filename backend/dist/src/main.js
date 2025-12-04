"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
        : ['http://localhost:3000', 'http://localhost:3001'];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            const isAllowed = allowedOrigins.some((allowedOrigin) => {
                const pattern = allowedOrigin
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(origin);
            });
            if (isAllowed) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Motel Management API')
        .setDescription('API for managing motel suites, tasks, employees, and operations')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Suites', 'Suite management')
        .addTag('Tasks', 'Task management')
        .addTag('Employees', 'Employee management')
        .addTag('Notes', 'Notes and communications')
        .addTag('Notifications', 'User notifications')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map