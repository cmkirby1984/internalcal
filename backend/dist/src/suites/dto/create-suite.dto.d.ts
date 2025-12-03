import { SuiteType, SuiteStatus, BedConfiguration } from '@prisma/client';
export declare class CurrentGuestDto {
    name?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    guestCount?: number;
    specialRequests?: string;
}
export declare class CreateSuiteDto {
    suiteNumber: string;
    floor: number;
    type: SuiteType;
    status?: SuiteStatus;
    currentGuest?: CurrentGuestDto;
    bedConfiguration: BedConfiguration;
    amenities?: string[];
    squareFeet?: number;
    notes?: string;
}
