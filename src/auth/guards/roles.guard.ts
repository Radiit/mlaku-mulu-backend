import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles) return true;

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new ForbiddenException('Access Denied');
        }

        // Owner has access to all roles
        if (user.role === 'owner') {
            return true;
        }

        // Check if user has required role
        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Access Denied');
        }
        
        return true;
    }
}