import { IsDateString, IsOptional, IsString, ValidateIf, IsObject } from "class-validator";

export class UpdateTripDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ValidateIf((o) => typeof o.destination === 'string')
    @IsString()
    destination?: string | Record<string, unknown>;

    @ValidateIf((o) => typeof o.destination === 'object')
    @IsObject()
    destinationObj?: Record<string, unknown>;
}