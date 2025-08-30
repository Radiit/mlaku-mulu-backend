import { IsString, IsNotEmpty, IsDateString, IsNumber, IsPositive, IsOptional, IsObject } from 'class-validator';

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsObject()
  @IsNotEmpty()
  destination: {
    name: string;
    location: string;
    description: string;
    highlights: string[];
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsPositive()
  maxCapacity: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsString()
  status?: string;
} 