import { IsDateString, IsOptional } from "class-validator";

export class UpdateTripDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsDateString()
    destination?: string;
}