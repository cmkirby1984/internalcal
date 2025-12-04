"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = exports.RbacGuard = exports.PERMISSIONS_MODE_KEY = exports.PERMISSIONS_KEY = void 0;
exports.RequirePermissions = RequirePermissions;
exports.RequireRoles = RequireRoles;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_1 = require("./permissions");
exports.PERMISSIONS_KEY = 'permissions';
exports.PERMISSIONS_MODE_KEY = 'permissions_mode';
function RequirePermissions(permissions, mode = 'any') {
    return (target, propertyKey, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(exports.PERMISSIONS_KEY, permissions, descriptor.value);
            Reflect.defineMetadata(exports.PERMISSIONS_MODE_KEY, mode, descriptor.value);
        }
        else {
            Reflect.defineMetadata(exports.PERMISSIONS_KEY, permissions, target);
            Reflect.defineMetadata(exports.PERMISSIONS_MODE_KEY, mode, target);
        }
        return descriptor || target;
    };
}
let RbacGuard = class RbacGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(exports.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const mode = this.reflector.getAllAndOverride(exports.PERMISSIONS_MODE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) || 'any';
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const userPermissions = user.permissions || [];
        let hasAccess;
        if (mode === 'all') {
            hasAccess = (0, permissions_1.hasAllPermissions)(userPermissions, requiredPermissions);
        }
        else {
            hasAccess = (0, permissions_1.hasAnyPermission)(userPermissions, requiredPermissions);
        }
        if (!hasAccess) {
            throw new common_1.ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
        }
        return true;
    }
};
exports.RbacGuard = RbacGuard;
exports.RbacGuard = RbacGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RbacGuard);
function RequireRoles(...roles) {
    return (target, propertyKey, descriptor) => {
        const rolesKey = 'roles';
        if (descriptor) {
            Reflect.defineMetadata(rolesKey, roles, descriptor.value);
        }
        else {
            Reflect.defineMetadata(rolesKey, roles, target);
        }
        return descriptor || target;
    };
}
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride('roles', [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new common_1.ForbiddenException(`Insufficient role. Required: ${requiredRoles.join(' or ')}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=rbac.guard.js.map