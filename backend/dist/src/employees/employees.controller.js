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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const dto_1 = require("./dto");
let EmployeesController = class EmployeesController {
    employeesService;
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    create(createEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }
    findAll(filters) {
        return this.employeesService.findAll(filters);
    }
    getStats() {
        return this.employeesService.getStats();
    }
    getOnDuty() {
        return this.employeesService.getOnDutyEmployees();
    }
    getAvailable() {
        return this.employeesService.getAvailableEmployees();
    }
    findOne(id) {
        return this.employeesService.findOne(id);
    }
    update(id, updateEmployeeDto) {
        return this.employeesService.update(id, updateEmployeeDto);
    }
    clockIn(id) {
        return this.employeesService.clockIn(id);
    }
    clockOut(id) {
        return this.employeesService.clockOut(id);
    }
    updateStatus(id, status) {
        return this.employeesService.updateStatus(id, status);
    }
    remove(id) {
        return this.employeesService.remove(id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new employee' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Employee created successfully' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Email/username/employee number already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees with filtering and pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of employees' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.FilterEmployeesDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get employee statistics for dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('on-duty'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all employees currently on duty' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of on-duty employees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getOnDuty", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all available employees (on duty, no active tasks)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of available employees' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an employee by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an employee' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/clock-in'),
    (0, swagger_1.ApiOperation)({ summary: 'Clock in an employee' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee clocked in' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Patch)(':id/clock-out'),
    (0, swagger_1.ApiOperation)({ summary: 'Clock out an employee' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee clocked out' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Patch)(':id/status/:status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update employee status' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiParam)({ name: 'status', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee status updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an employee' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Employee deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Employee not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('Employees'),
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map