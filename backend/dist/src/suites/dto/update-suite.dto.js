"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSuiteDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_suite_dto_1 = require("./create-suite.dto");
class UpdateSuiteDto extends (0, swagger_1.PartialType)(create_suite_dto_1.CreateSuiteDto) {
}
exports.UpdateSuiteDto = UpdateSuiteDto;
//# sourceMappingURL=update-suite.dto.js.map