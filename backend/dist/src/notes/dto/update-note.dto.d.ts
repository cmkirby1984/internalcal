import { CreateNoteDto } from './create-note.dto';
declare const UpdateNoteDto_base: import("@nestjs/common").Type<Partial<CreateNoteDto>>;
export declare class UpdateNoteDto extends UpdateNoteDto_base {
    archived?: boolean;
    followUpCompleted?: boolean;
}
export {};
