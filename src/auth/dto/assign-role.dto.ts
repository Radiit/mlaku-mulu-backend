import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AssignRoleDto {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsString({ message: 'Role must be a string' })
  @IsNotEmpty({ message: 'Role is required' })
  @IsIn(['owner', 'pegawai', 'turis'], { 
    message: 'Role must be one of: owner, pegawai, turis' 
  })
  role: 'owner' | 'pegawai' | 'turis';
} 