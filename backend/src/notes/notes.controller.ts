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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, FilterNotesDto } from './dto';
import { JwtAuthGuard, CurrentUser } from '../auth';

@ApiTags('Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  create(
    @Body() createNoteDto: CreateNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.create(createNoteDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of notes' })
  findAll(@Query() filters: FilterNotesDto, @CurrentUser('id') userId: string) {
    return this.notesService.findAll(filters, userId);
  }

  @Get('pinned')
  @ApiOperation({ summary: 'Get all pinned notes' })
  @ApiResponse({ status: 200, description: 'List of pinned notes' })
  getPinned() {
    return this.notesService.getPinnedNotes();
  }

  @Get('follow-up-due')
  @ApiOperation({ summary: 'Get notes with due follow-ups' })
  @ApiResponse({ status: 200, description: 'List of notes needing follow-up' })
  getFollowUpDue() {
    return this.notesService.getFollowUpDue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Note details' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('text') text: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.addComment(id, text, userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a note as read' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.markAsRead(id, userId);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.archive(id);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  unarchive(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.unarchive(id);
  }

  @Patch(':id/pin')
  @ApiOperation({ summary: 'Pin a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  pin(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.pin(id);
  }

  @Patch(':id/unpin')
  @ApiOperation({ summary: 'Unpin a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  unpin(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.unpin(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notesService.remove(id);
  }
}
