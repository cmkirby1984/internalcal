import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const PERMISSIONS_KEY = "permissions";
export declare const PERMISSIONS_MODE_KEY = "permissions_mode";
export type PermissionsMode = 'any' | 'all';
export declare function RequirePermissions(permissions: string[], mode?: PermissionsMode): (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => any;
export declare class RbacGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
export declare function RequireRoles(...roles: string[]): (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => any;
export declare class RolesGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
