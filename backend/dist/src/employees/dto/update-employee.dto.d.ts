import { CreateEmployeeDto } from './create-employee.dto';
declare const UpdateEmployeeDto_base: import("@nestjs/common").Type<Partial<Omit<CreateEmployeeDto, "username" | "password">>>;
export declare class UpdateEmployeeDto extends UpdateEmployeeDto_base {
}
export {};
