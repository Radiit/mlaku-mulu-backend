import { IsDateString, IsString, IsOptional, ValidateIf, IsObject } from "class-validator";

export class CreateTripDto {
    @IsString()
    turisId: string;

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