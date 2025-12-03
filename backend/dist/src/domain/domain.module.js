"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const status_1 = require("./status");
const listeners_1 = require("./listeners");
const queue_1 = require("./queue");
const rbac_1 = require("./rbac");
let DomainModule = class DomainModule {
};
exports.DomainModule = DomainModule;
exports.DomainModule = DomainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot({
                wildcard: false,
                delimiter: '.',
                newListener: false,
                removeListener: false,
                maxListeners: 10,
                verboseMemoryLeak: true,
                ignoreErrors: false,
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    redis: {
                        host: configService.get('REDIS_HOST') || 'localhost',
                        port: configService.get('REDIS_PORT') || 6379,
                        password: configService.get('REDIS_PASSWORD') || undefined,
                    },
                    defaultJobOptions: {
                        removeOnComplete: true,
                        removeOnFail: false,
                        attempts: 3,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            bull_1.BullModule.registerQueue({
                name: 'notifications',
            }),
        ],
        providers: [
            status_1.SuiteStatusService,
            status_1.TaskStatusService,
            listeners_1.TaskEventListener,
            listeners_1.SuiteEventListener,
            listeners_1.EmployeeEventListener,
            listeners_1.NoteEventListener,
            queue_1.NotificationProcessor,
            queue_1.NotificationQueueService,
            rbac_1.RbacGuard,
            rbac_1.RolesGuard,
        ],
        exports: [
            status_1.SuiteStatusService,
            status_1.TaskStatusService,
            queue_1.NotificationQueueService,
            rbac_1.RbacGuard,
            rbac_1.RolesGuard,
        ],
    })
], DomainModule);
//# sourceMappingURL=domain.module.js.map