import { IsOptional, IsString, isString } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    role?: 'pegawai' | 'turis';

    @IsOptional()
    @IsString()
    phone?: string;
}