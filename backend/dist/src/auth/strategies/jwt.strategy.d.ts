import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
export interface JwtPayload {
    sub: string;
    username: string;
    role: string;
    permissions: string[];
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        role: import("@prisma/client").$Enums.EmployeeRole;
        status: import("@prisma/client").$Enums.EmployeeStatus;
        permissions: string[];
    }>;
}
export {};
