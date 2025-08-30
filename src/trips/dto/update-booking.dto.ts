import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;
} 