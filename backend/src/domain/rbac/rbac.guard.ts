import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

export type PermissionsMode = 'any' | 'all';

/**
 * Decorator to require specific permissions
 * @param permissions - Array of required permissions
 * @param mode - 'any' (default) requires at least one, 'all' requires all
 */
export function RequirePermissions(
  permissions: string[],
  mode: PermissionsMode = 'any',
) {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, descriptor.value);
      Reflect.defineMetadata(PERMISSIONS_MODE_KEY, mode, descriptor.value);
    } else {
      Reflect.defineMetadata(PERMISSIONS_KEY, permissions, target);
      Reflect.defineMetadata(PERMISSIONS_MODE_KEY, mode, target);
    }
    return descriptor || target;
  };
}

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const mode = this.reflector.getAllAndOverride<PermissionsMode>(
      PERMISSIONS_MODE_KEY,
      [context.getHandler(), context.getClass()],
    ) || 'any';

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userPermissions: string[] = user.permissions || [];

    let hasAccess: boolean;

    if (mode === 'all') {
      hasAccess = hasAllPermissions(userPermissions, requiredPermissions);
    } else {
      hasAccess = hasAnyPermission(userPermissions, requiredPermissions);
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Decorator for role-based access (convenience wrapper)
 */
export function RequireRoles(...roles: string[]) {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    const rolesKey = 'roles';
    if (descriptor) {
      Reflect.defineMetadata(rolesKey, roles, descriptor.value);
    } else {
      Reflect.defineMetadata(rolesKey, roles, target);
    }
    return descriptor || target;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}

