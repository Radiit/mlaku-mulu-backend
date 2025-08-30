import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyOwnerOtpDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters long' })
  otp: string;
} 