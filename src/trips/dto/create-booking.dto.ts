import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsOptional()
  @IsString()
  notes?: string;
} 