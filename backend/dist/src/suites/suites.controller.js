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
exports.SuitesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const suites_service_1 = require("./suites.service");
const dto_1 = require("./dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let SuitesController = class SuitesController {
    suitesService;
    constructor(suitesService) {
        this.suitesService = suitesService;
    }
    create(createSuiteDto) {
        return this.suitesService.create(createSuiteDto);
    }
    findAll(paginationDto) {
        console.log('GET /suites endpoint hit');
        return this.suitesService.findAll(paginationDto);
    }
    getStats() {
        return this.suitesService.getStats();
    }
    findOne(id) {
        return this.suitesService.findOne(id);
    }
    findByNumber(suiteNumber) {
        return this.suitesService.findByNumber(suiteNumber);
    }
    update(id, updateSuiteDto) {
        return this.suitesService.update(id, updateSuiteDto);
    }
    updateStatus(id, status) {
        return this.suitesService.updateStatus(id, status);
    }
    remove(id) {
        return this.suitesService.remove(id);
    }
};
exports.SuitesController = SuitesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new suite' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Suite created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Suite number already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSuiteDto]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all suites with filtering and pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of suites' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get suite statistics for dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a suite by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Suite not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('number/:suiteNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a suite by suite number' }),
    (0, swagger_1.ApiParam)({ name: 'suiteNumber', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Suite not found' }),
    __param(0, (0, common_1.Param)('suiteNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "findByNumber", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a suite' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Suite not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSuiteDto]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status/:status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update suite status' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiParam)({ name: 'status', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite status updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Suite not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a suite' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', format: 'uuid' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suite deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Suite not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuitesController.prototype, "remove", null);
exports.SuitesController = SuitesController = __decorate([
    (0, swagger_1.ApiTags)('Suites'),
    (0, common_1.Controller)('suites'),
    __metadata("design:paramtypes", [suites_service_1.SuitesService])
], SuitesController);
//# sourceMappingURL=suites.controller.js.map