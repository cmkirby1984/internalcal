"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient({
    log: ['info', 'warn', 'error'],
});
async function main() {
    console.log('🌱 Starting database seed...');
    // Create admin user
    const adminPassword = await argon2.hash('admin123');
    const admin = await prisma.employee.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            employeeNumber: 'EMP001',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@motel.com',
            phone: '+1234567890',
            role: 'ADMIN',
            department: 'MANAGEMENT',
            status: 'ACTIVE',
            username: 'admin',
            passwordHash: adminPassword,
            permissions: ['*'],
            isOnDuty: true,
            hireDate: new Date('2024-01-01'),
        },
    });
    console.log(`✅ Created admin user: ${admin.username}`);
    // Create supervisor
    const supervisorPassword = await argon2.hash('supervisor123');
    const supervisor = await prisma.employee.upsert({
        where: { username: 'supervisor' },
        update: {},
        create: {
            employeeNumber: 'EMP002',
            firstName: 'Jane',
            lastName: 'Supervisor',
            email: 'jane@motel.com',
            role: 'SUPERVISOR',
            department: 'HOUSEKEEPING',
            status: 'ACTIVE',
            username: 'supervisor',
            passwordHash: supervisorPassword,
            permissions: ['view_all_tasks', 'assign_tasks', 'view_all_suites', 'add_tasks', 'view_employees'],
            isOnDuty: true,
            hireDate: new Date('2024-02-01'),
        },
    });
    console.log(`✅ Created supervisor: ${supervisor.username}`);
    // Create housekeeper
    const housekeeperPassword = await argon2.hash('housekeeper123');
    const housekeeper = await prisma.employee.upsert({
        where: { username: 'housekeeper1' },
        update: {},
        create: {
            employeeNumber: 'EMP003',
            firstName: 'Maria',
            lastName: 'Cleaner',
            email: 'maria@motel.com',
            role: 'HOUSEKEEPER',
            department: 'HOUSEKEEPING',
            status: 'ACTIVE',
            username: 'housekeeper1',
            passwordHash: housekeeperPassword,
            permissions: ['view_assigned_tasks', 'update_task_status', 'add_notes'],
            isOnDuty: true,
            hireDate: new Date('2024-03-01'),
        },
    });
    console.log(`✅ Created housekeeper: ${housekeeper.username}`);
    // Create maintenance worker
    const maintenancePassword = await argon2.hash('maintenance123');
    const maintenance = await prisma.employee.upsert({
        where: { username: 'maintenance1' },
        update: {},
        create: {
            employeeNumber: 'EMP004',
            firstName: 'Bob',
            lastName: 'Fixer',
            email: 'bob@motel.com',
            role: 'MAINTENANCE',
            department: 'MAINTENANCE',
            status: 'ACTIVE',
            username: 'maintenance1',
            passwordHash: maintenancePassword,
            permissions: ['view_assigned_tasks', 'update_task_status', 'add_maintenance_notes', 'update_suite_status'],
            isOnDuty: false,
            hireDate: new Date('2024-03-15'),
        },
    });
    console.log(`✅ Created maintenance worker: ${maintenance.username}`);
    // Create sample suites
    const suiteTypes = ['STANDARD', 'DELUXE', 'SUITE', 'ACCESSIBLE'];
    const bedConfigs = ['QUEEN', 'KING', 'TWIN_BEDS', 'QUEEN_PLUS_SOFA'];
    const statuses = ['VACANT_CLEAN', 'VACANT_DIRTY', 'OCCUPIED_CLEAN', 'OCCUPIED_DIRTY'];
    for (let floor = 1; floor <= 3; floor++) {
        for (let room = 1; room <= 8; room++) {
            const suiteNumber = `${floor}0${room}`;
            const typeIndex = (floor + room) % suiteTypes.length;
            const bedIndex = (floor + room) % bedConfigs.length;
            const statusIndex = (floor * room) % statuses.length;
            await prisma.suite.upsert({
                where: { suiteNumber },
                update: {},
                create: {
                    suiteNumber,
                    floor,
                    type: suiteTypes[typeIndex],
                    status: statuses[statusIndex],
                    bedConfiguration: bedConfigs[bedIndex],
                    amenities: ['WiFi', 'TV', 'Air Conditioning'],
                    squareFeet: 300 + (typeIndex * 100),
                    lastCleaned: statusIndex < 2 ? new Date() : null,
                },
            });
        }
    }
    console.log('✅ Created 24 sample suites');
    // Create sample tasks
    const dirtySuites = await prisma.suite.findMany({
        where: { status: { in: ['VACANT_DIRTY', 'OCCUPIED_DIRTY'] } },
        take: 5,
    });
    for (const suite of dirtySuites) {
        await prisma.task.create({
            data: {
                type: 'CLEANING',
                priority: suite.status === 'VACANT_DIRTY' ? 'HIGH' : 'NORMAL',
                status: 'PENDING',
                title: `Clean Suite ${suite.suiteNumber}`,
                description: `Standard cleaning required for suite ${suite.suiteNumber}`,
                suiteId: suite.id,
                estimatedDuration: 45,
            },
        });
    }
    console.log(`✅ Created ${dirtySuites.length} cleaning tasks`);
    // Create a maintenance task
    const suite101 = await prisma.suite.findUnique({ where: { suiteNumber: '101' } });
    if (suite101) {
        await prisma.task.create({
            data: {
                type: 'MAINTENANCE',
                priority: 'NORMAL',
                status: 'ASSIGNED',
                title: 'Fix leaky faucet in Suite 101',
                description: 'Guest reported dripping faucet in bathroom',
                suiteId: suite101.id,
                assignedToId: maintenance.id,
                estimatedDuration: 30,
            },
        });
        console.log('✅ Created maintenance task');
    }
    // Create sample notes
    await prisma.note.create({
        data: {
            type: 'HANDOFF',
            priority: 'HIGH',
            title: 'Morning Shift Handoff',
            content: 'VIP guest arriving at 2pm in Suite 201. Please ensure extra amenities are placed.',
            createdById: supervisor.id,
            visibility: 'ALL_STAFF',
            pinned: true,
            tags: ['vip', 'priority'],
        },
    });
    await prisma.note.create({
        data: {
            type: 'MAINTENANCE',
            priority: 'NORMAL',
            title: 'HVAC Inspection Due',
            content: 'Annual HVAC inspection scheduled for next week. Need to coordinate with maintenance team.',
            createdById: admin.id,
            visibility: 'MANAGERS_ONLY',
            requiresFollowUp: true,
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            followUpAssignedToId: maintenance.id,
        },
    });
    console.log('✅ Created sample notes');
    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Admin:       admin / admin123');
    console.log('   Supervisor:  supervisor / supervisor123');
    console.log('   Housekeeper: housekeeper1 / housekeeper123');
    console.log('   Maintenance: maintenance1 / maintenance123');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
