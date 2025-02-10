import { IsEmail, isString, IsString, MinLength } from 'class-validator';
export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    role: 'pegawai' | 'turis';
}