"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEmployeeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_employee_dto_1 = require("./create-employee.dto");
class UpdateEmployeeDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_employee_dto_1.CreateEmployeeDto, ['password', 'username'])) {
}
exports.UpdateEmployeeDto = UpdateEmployeeDto;
//# sourceMappingURL=update-employee.dto.js.map