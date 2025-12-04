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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
const argon2 = __importStar(require("argon2"));
let SetupController = class SetupController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAdmin() {
        const existingAdmin = await this.prisma.employee.findUnique({
            where: { username: 'admin' },
        });
        if (existingAdmin) {
            return {
                success: false,
                message: 'Admin user already exists',
                username: 'admin',
            };
        }
        const adminPassword = await argon2.hash('admin123');
        const admin = await this.prisma.employee.create({
            data: {
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
        return {
            success: true,
            message: 'Admin user created successfully!',
            username: admin.username,
            password: 'admin123',
            instructions: 'You can now login with username: admin, password: admin123',
        };
    }
};
exports.SetupController = SetupController;
__decorate([
    (0, common_1.Post)('create-admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SetupController.prototype, "createAdmin", null);
exports.SetupController = SetupController = __decorate([
    (0, common_1.Controller)('setup'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SetupController);
//# sourceMappingURL=setup.controller.js.map