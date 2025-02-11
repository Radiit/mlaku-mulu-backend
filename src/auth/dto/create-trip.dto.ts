import { IsDateString, IsString } from "class-validator";

export class CreateTripDto {
    @IsString()
    turisId: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsString()
    destination: string;
}