"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
const prisma_1 = require("./prisma");
const domain_1 = require("./domain");
const auth_1 = require("./auth");
const suites_1 = require("./suites");
const tasks_1 = require("./tasks");
const employees_1 = require("./employees");
const notes_1 = require("./notes");
const notifications_1 = require("./notifications");
const realtime_1 = require("./realtime");
const health_1 = require("./health");
const interceptors_1 = require("./common/interceptors");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const setup_controller_1 = require("./setup.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_1.PrismaModule,
            domain_1.DomainModule,
            auth_1.AuthModule,
            suites_1.SuitesModule,
            tasks_1.TasksModule,
            employees_1.EmployeesModule,
            notes_1.NotesModule,
            notifications_1.NotificationsModule,
            realtime_1.RealtimeModule,
            health_1.HealthModule,
        ],
        controllers: [app_controller_1.AppController, setup_controller_1.SetupController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_PIPE,
                useValue: new common_2.ValidationPipe({
                    whitelist: true,
                    transform: true,
                    transformOptions: {
                        enableImplicitConversion: true,
                    },
                }),
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: interceptors_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: auth_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map