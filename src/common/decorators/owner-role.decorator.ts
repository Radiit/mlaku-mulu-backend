import { SetMetadata } from '@nestjs/common';

export const OWNER_ROLE_KEY = 'owner_role';
export const OwnerRole = () => SetMetadata(OWNER_ROLE_KEY, 'owner'); 