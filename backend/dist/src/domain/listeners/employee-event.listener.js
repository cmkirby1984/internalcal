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
var EmployeeEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../../prisma");
const events_1 = require("../events");
let EmployeeEventListener = EmployeeEventListener_1 = class EmployeeEventListener {
    prisma;
    logger = new common_1.Logger(EmployeeEventListener_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleEmployeeClockIn(event) {
        this.logger.log(`Employee clocked in: ${event.employeeName}`);
    }
    async handleEmployeeClockOut(event) {
        this.logger.log(`Employee clocked out: ${event.employeeName}`);
        if (event.activeTaskIds && event.activeTaskIds.length > 0) {
            this.logger.warn(`Employee ${event.employeeName} clocked out with ${event.activeTaskIds.length} active tasks`);
            await this.prisma.task.updateMany({
                where: {
                    id: { in: event.activeTaskIds },
                    status: 'IN_PROGRESS',
                },
                data: {
                    status: 'PAUSED',
                },
            });
            const supervisors = await this.prisma.employee.findMany({
                where: {
                    role: { in: ['SUPERVISOR', 'MANAGER'] },
                    isOnDuty: true,
                },
                select: { id: true },
            });
            if (supervisors.length > 0) {
                await this.prisma.notification.createMany({
                    data: supervisors.map((s) => ({
                        recipientId: s.id,
                        type: 'SYSTEM_ALERT',
                        title: 'Tasks Paused - Employee Clocked Out',
                        message: `${event.employeeName} clocked out with ${event.activeTaskIds.length} active task(s)`,
                        priority: 'HIGH',
                    })),
                });
            }
        }
    }
};
exports.EmployeeEventListener = EmployeeEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.EMPLOYEE_CLOCK_IN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.EmployeeClockInEvent]),
    __metadata("design:returntype", Promise)
], EmployeeEventListener.prototype, "handleEmployeeClockIn", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.EMPLOYEE_CLOCK_OUT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.EmployeeClockOutEvent]),
    __metadata("design:returntype", Promise)
], EmployeeEventListener.prototype, "handleEmployeeClockOut", null);
exports.EmployeeEventListener = EmployeeEventListener = EmployeeEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], EmployeeEventListener);
//# sourceMappingURL=employee-event.listener.js.map