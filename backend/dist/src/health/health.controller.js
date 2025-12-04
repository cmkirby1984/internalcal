"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let HealthController = class HealthController {
    prisma;
    realtimeGateway;
    startTime = Date.now();
    constructor(prisma, realtimeGateway) {
        this.prisma = prisma;
        this.realtimeGateway = realtimeGateway;
    }
    async check() {
        const checks = await Promise.all([
            this.checkDatabase(),
            this.checkWebSocket(),
            this.checkMemory(),
        ]);
        const [database, websocket, memory] = checks;
        const allUp = database.status === 'up' &&
            websocket.status === 'up' &&
            memory.status === 'up';
        const anyDown = database.status === 'down' || websocket.status === 'down';
        return {
            status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            checks: {
                database,
                websocket,
                memory,
            },
        };
    }
    async liveness() {
        return { status: 'ok' };
    }
    async readiness() {
        const dbCheck = await this.checkDatabase();
        return {
            status: dbCheck.status === 'up' ? 'ok' : 'not ready',
            ready: dbCheck.status === 'up',
        };
    }
    async checkDatabase() {
        const start = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'up',
                responseTime: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: 'down',
                responseTime: Date.now() - start,
                details: { error: error.message },
            };
        }
    }
    checkWebSocket() {
        try {
            return {
                status: 'up',
                details: {
                    connectedUsers: this.realtimeGateway.getConnectedUsersCount(),
                    totalConnections: this.realtimeGateway.getConnectionsCount(),
                },
            };
        }
        catch (error) {
            return {
                status: 'down',
                details: { error: error.message },
            };
        }
    }
    checkMemory() {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
        return {
            status: usagePercent > 90 ? 'down' : 'up',
            details: {
                heapUsedMB,
                heapTotalMB,
                usagePercent,
                rss: Math.round(memUsage.rss / 1024 / 1024),
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "liveness", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], HealthController);
//# sourceMappingURL=health.controller.js.map