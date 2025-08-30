import { IsString, IsNotEmpty, IsDateString, IsNumber, IsPositive, IsOptional, IsObject } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsObject()
  @IsNotEmpty()
  destination?: {
    name: string;
    location: string;
    description: string;
    highlights: string[];
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxCapacity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsString()
  status?: string;
} 