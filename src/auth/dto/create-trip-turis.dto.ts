import { IsDateString, IsString, IsOptional, ValidateIf, IsObject } from "class-validator";

export class CreateTripTurisDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @ValidateIf((o) => typeof o.destination === 'string')
    @IsString()
    destination?: string | Record<string, unknown>;

    @ValidateIf((o) => typeof o.destination === 'object')
    @IsObject()
    destinationObj?: Record<string, unknown>;
} 