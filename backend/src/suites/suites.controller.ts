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
import { SuitesService } from './suites.service';
import { CreateSuiteDto, UpdateSuiteDto, FilterSuitesDto } from './dto';
import { PaginationDto } from '../common/dto/pagination.dto'; // Added import

@ApiTags('Suites')
@Controller('suites')
export class SuitesController {
  constructor(private readonly suitesService: SuitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new suite' })
  @ApiResponse({ status: 201, description: 'Suite created successfully' })
  @ApiResponse({ status: 409, description: 'Suite number already exists' })
  create(@Body() createSuiteDto: CreateSuiteDto) {
    return this.suitesService.create(createSuiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suites with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of suites' })
  findAll(@Query() paginationDto: PaginationDto) {
    console.log('GET /suites endpoint hit');
    return this.suitesService.findAll(paginationDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get suite statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'Suite statistics' })
  getStats() {
    return this.suitesService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a suite by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Suite details' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suitesService.findOne(id);
  }

  @Get('number/:suiteNumber')
  @ApiOperation({ summary: 'Get a suite by suite number' })
  @ApiParam({ name: 'suiteNumber', type: 'string' })
  @ApiResponse({ status: 200, description: 'Suite details' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  findByNumber(@Param('suiteNumber') suiteNumber: string) {
    return this.suitesService.findByNumber(suiteNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a suite' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Suite updated successfully' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSuiteDto: UpdateSuiteDto,
  ) {
    return this.suitesService.update(id, updateSuiteDto);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update suite status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'status', type: 'string' })
  @ApiResponse({ status: 200, description: 'Suite status updated' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: string,
  ) {
    return this.suitesService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a suite' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Suite deleted successfully' })
  @ApiResponse({ status: 404, description: 'Suite not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suitesService.remove(id);
  }
}

