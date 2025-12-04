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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, FilterTasksDto } from './dto';
import { TaskStatus } from '@prisma/client';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  findAll(@Query() filters: FilterTasksDto) {
    console.log('GET /tasks endpoint hit');
    return this.tasksService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Task statistics' })
  getStats() {
    return this.tasksService.getStats();
  }

  @Get('suite/:suiteId')
  @ApiOperation({ summary: 'Get all tasks for a suite' })
  @ApiParam({ name: 'suiteId', type: 'string', format: 'uuid' })
  findBySuite(@Param('suiteId', ParseUUIDPipe) suiteId: string) {
    return this.tasksService.findBySuite(suiteId);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get all tasks assigned to an employee' })
  @ApiParam({ name: 'employeeId', type: 'string', format: 'uuid' })
  findByEmployee(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.tasksService.findByEmployee(employeeId, activeOnly === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'status', enum: TaskStatus })
  @ApiResponse({ status: 200, description: 'Task status updated' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: TaskStatus,
  ) {
    return this.tasksService.updateStatus(id, status);
  }

  @Patch(':id/assign/:employeeId')
  @ApiOperation({ summary: 'Assign task to an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'employeeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.tasksService.assignTask(id, employeeId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id);
  }
}
