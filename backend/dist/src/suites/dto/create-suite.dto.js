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
exports.CreateSuiteDto = exports.CurrentGuestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CurrentGuestDto {
    name;
    checkInDate;
    checkOutDate;
    guestCount;
    specialRequests;
}
exports.CurrentGuestDto = CurrentGuestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CurrentGuestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CurrentGuestDto.prototype, "checkInDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CurrentGuestDto.prototype, "checkOutDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CurrentGuestDto.prototype, "guestCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CurrentGuestDto.prototype, "specialRequests", void 0);
class CreateSuiteDto {
    suiteNumber;
    floor;
    type;
    status;
    currentGuest;
    bedConfiguration;
    amenities;
    squareFeet;
    notes;
}
exports.CreateSuiteDto = CreateSuiteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '101' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSuiteDto.prototype, "suiteNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSuiteDto.prototype, "floor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.SuiteType }),
    (0, class_validator_1.IsEnum)(client_1.SuiteType),
    __metadata("design:type", String)
], CreateSuiteDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.SuiteStatus, default: client_1.SuiteStatus.VACANT_CLEAN }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SuiteStatus),
    __metadata("design:type", String)
], CreateSuiteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: CurrentGuestDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", CurrentGuestDto)
], CreateSuiteDto.prototype, "currentGuest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.BedConfiguration }),
    (0, class_validator_1.IsEnum)(client_1.BedConfiguration),
    __metadata("design:type", String)
], CreateSuiteDto.prototype, "bedConfiguration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['WiFi', 'Mini-Fridge'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSuiteDto.prototype, "amenities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 450 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSuiteDto.prototype, "squareFeet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSuiteDto.prototype, "notes", void 0);
//# sourceMappingURL=create-suite.dto.js.map