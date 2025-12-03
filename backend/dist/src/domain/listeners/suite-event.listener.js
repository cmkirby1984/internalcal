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
var SuiteEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuiteEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../../prisma");
const events_1 = require("../events");
let SuiteEventListener = SuiteEventListener_1 = class SuiteEventListener {
    prisma;
    logger = new common_1.Logger(SuiteEventListener_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleSuiteStatusChanged(event) {
        this.logger.log(`Suite ${event.suiteNumber} status: ${event.previousStatus} -> ${event.newStatus}`);
        if (event.newStatus === 'VACANT_DIRTY') {
            const existingTask = await this.prisma.task.findFirst({
                where: {
                    suiteId: event.suiteId,
                    type: 'CLEANING',
                    status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
                },
            });
            if (!existingTask) {
                await this.prisma.task.create({
                    data: {
                        type: 'CLEANING',
                        priority: 'NORMAL',
                        status: 'PENDING',
                        title: `Clean Suite ${event.suiteNumber}`,
                        description: 'Standard cleaning after checkout',
                        suiteId: event.suiteId,
                        estimatedDuration: 45,
                    },
                });
                this.logger.log(`Auto-created cleaning task for Suite ${event.suiteNumber}`);
            }
        }
    }
    async handleSuiteCheckedOut(event) {
        this.logger.log(`Suite ${event.suiteNumber} checked out`);
        await this.prisma.suite.update({
            where: { id: event.suiteId },
            data: {
                status: 'VACANT_DIRTY',
                currentGuest: undefined,
            },
        });
        await this.prisma.task.create({
            data: {
                type: 'CLEANING',
                priority: 'HIGH',
                status: 'PENDING',
                title: `Checkout Clean - Suite ${event.suiteNumber}`,
                description: 'Full checkout cleaning required',
                suiteId: event.suiteId,
                estimatedDuration: 60,
            },
        });
    }
    async handleSuiteOutOfOrder(event) {
        this.logger.warn(`Suite ${event.suiteNumber} marked OUT OF ORDER: ${event.reason || 'No reason provided'}`);
        const maintenanceStaff = await this.prisma.employee.findMany({
            where: {
                role: { in: ['MAINTENANCE', 'SUPERVISOR', 'MANAGER'] },
                department: 'MAINTENANCE',
                status: { not: 'INACTIVE' },
            },
            select: { id: true },
        });
        if (maintenanceStaff.length > 0) {
            await this.prisma.notification.createMany({
                data: maintenanceStaff.map((m) => ({
                    recipientId: m.id,
                    type: 'SUITE_STATUS_CHANGE',
                    title: 'Suite Out of Order',
                    message: `Suite ${event.suiteNumber} requires maintenance${event.reason ? `: ${event.reason}` : ''}`,
                    priority: 'HIGH',
                    relatedEntityType: 'Suite',
                    relatedEntityId: event.suiteId,
                    actionUrl: `/suites/${event.suiteId}`,
                })),
            });
        }
    }
};
exports.SuiteEventListener = SuiteEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.SUITE_STATUS_CHANGED),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.SuiteStatusChangedEvent]),
    __metadata("design:returntype", Promise)
], SuiteEventListener.prototype, "handleSuiteStatusChanged", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.SUITE_CHECKED_OUT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.SuiteCheckedOutEvent]),
    __metadata("design:returntype", Promise)
], SuiteEventListener.prototype, "handleSuiteCheckedOut", null);
__decorate([
    (0, event_emitter_1.OnEvent)(events_1.DomainEventNames.SUITE_OUT_OF_ORDER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [events_1.SuiteOutOfOrderEvent]),
    __metadata("design:returntype", Promise)
], SuiteEventListener.prototype, "handleSuiteOutOfOrder", null);
exports.SuiteEventListener = SuiteEventListener = SuiteEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], SuiteEventListener);
//# sourceMappingURL=suite-event.listener.js.map