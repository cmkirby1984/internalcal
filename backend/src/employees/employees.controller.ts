import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, FilterEmployeesDto } from './dto';

@ApiTags('Employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 409, description: 'Email/username/employee number already exists' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of employees' })
  findAll(@Query() filters: FilterEmployeesDto) {
    return this.employeesService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get employee statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Employee statistics' })
  getStats() {
    return this.employeesService.getStats();
  }

  @Get('on-duty')
  @ApiOperation({ summary: 'Get all employees currently on duty' })
  @ApiResponse({ status: 200, description: 'List of on-duty employees' })
  getOnDuty() {
    return this.employeesService.getOnDutyEmployees();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get all available employees (on duty, no active tasks)' })
  @ApiResponse({ status: 200, description: 'List of available employees' })
  getAvailable() {
    return this.employeesService.getAvailableEmployees();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee details' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Patch(':id/clock-in')
  @ApiOperation({ summary: 'Clock in an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee clocked in' })
  clockIn(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.clockIn(id);
  }

  @Patch(':id/clock-out')
  @ApiOperation({ summary: 'Clock out an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee clocked out' })
  clockOut(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.clockOut(id);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update employee status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'status', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee status updated' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: string,
  ) {
    return this.employeesService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.remove(id);
  }
}

