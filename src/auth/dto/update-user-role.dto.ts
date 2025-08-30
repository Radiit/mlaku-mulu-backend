import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['owner', 'pegawai', 'turis'], { 
    message: 'Role must be one of: owner, pegawai, turis' 
  })
  role: 'owner' | 'pegawai' | 'turis';
} 