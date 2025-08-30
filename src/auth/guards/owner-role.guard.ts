import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNER_ROLE_KEY } from '../../common/decorators/owner-role.decorator';

@Injectable()
export class OwnerRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<string>(OWNER_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true; // No role requirement, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Owner can access everything, pegawai can access pegawai APIs
    if (user.role === 'owner' || user.role === 'pegawai') {
      return true;
    }

    throw new ForbiddenException('Insufficient permissions. Owner or pegawai role required.');
  }
} 