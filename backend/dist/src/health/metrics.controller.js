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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let MetricsController = class MetricsController {
    prisma;
    realtimeGateway;
    startTime = Date.now();
    constructor(prisma, realtimeGateway) {
        this.prisma = prisma;
        this.realtimeGateway = realtimeGateway;
    }
    async getMetrics() {
        const [dbMetrics, wsMetrics] = await Promise.all([
            this.getDatabaseMetrics(),
            this.getWebSocketMetrics(),
        ]);
        return {
            timestamp: new Date().toISOString(),
            application: {
                uptime: Math.floor((Date.now() - this.startTime) / 1000),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
            database: dbMetrics,
            websocket: wsMetrics,
            system: this.getSystemMetrics(),
        };
    }
    async getPrometheusMetrics() {
        const metrics = await this.getMetrics();
        const lines = [
            '# HELP motel_uptime_seconds Application uptime in seconds',
            '# TYPE motel_uptime_seconds gauge',
            `motel_uptime_seconds ${metrics.application.uptime}`,
            '',
            '# HELP motel_memory_heap_used_bytes Memory heap used in bytes',
            '# TYPE motel_memory_heap_used_bytes gauge',
            `motel_memory_heap_used_bytes ${metrics.system.memoryUsage.heapUsedMB * 1024 * 1024}`,
            '',
            '# HELP motel_websocket_connections Current WebSocket connections',
            '# TYPE motel_websocket_connections gauge',
            `motel_websocket_connections ${metrics.websocket.totalConnections}`,
            '',
            '# HELP motel_websocket_users Connected unique users',
            '# TYPE motel_websocket_users gauge',
            `motel_websocket_users ${metrics.websocket.connectedUsers}`,
            '',
            '# HELP motel_suites_total Total number of suites',
            '# TYPE motel_suites_total gauge',
            `motel_suites_total ${metrics.database.suiteCount}`,
            '',
            '# HELP motel_tasks_total Total number of tasks',
            '# TYPE motel_tasks_total gauge',
            `motel_tasks_total ${metrics.database.taskCount}`,
            '',
            '# HELP motel_tasks_pending Number of pending tasks',
            '# TYPE motel_tasks_pending gauge',
            `motel_tasks_pending ${metrics.database.pendingTasks}`,
            '',
            '# HELP motel_tasks_in_progress Number of in-progress tasks',
            '# TYPE motel_tasks_in_progress gauge',
            `motel_tasks_in_progress ${metrics.database.inProgressTasks}`,
            '',
            '# HELP motel_employees_total Total number of employees',
            '# TYPE motel_employees_total gauge',
            `motel_employees_total ${metrics.database.employeeCount}`,
        ];
        return lines.join('\n');
    }
    async getDatabaseMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [suiteCount, taskCount, employeeCount, noteCount, pendingTasks, inProgressTasks, completedTasksToday,] = await Promise.all([
            this.prisma.suite.count(),
            this.prisma.task.count(),
            this.prisma.employee.count(),
            this.prisma.note.count(),
            this.prisma.task.count({ where: { status: 'PENDING' } }),
            this.prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.task.count({
                where: {
                    status: 'COMPLETED',
                    completedAt: { gte: today },
                },
            }),
        ]);
        return {
            suiteCount,
            taskCount,
            employeeCount,
            noteCount,
            pendingTasks,
            inProgressTasks,
            completedTasksToday,
        };
    }
    getWebSocketMetrics() {
        return {
            connectedUsers: this.realtimeGateway.getConnectedUsersCount(),
            totalConnections: this.realtimeGateway.getConnectionsCount(),
        };
    }
    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        return {
            memoryUsage: {
                heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
                rssMB: Math.round(memUsage.rss / 1024 / 1024),
                percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
            },
            cpuUsage: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform,
        };
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getMetrics", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('prometheus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getPrometheusMetrics", null);
exports.MetricsController = MetricsController = __decorate([
    (0, common_1.Controller)('metrics'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_gateway_1.RealtimeGateway])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map