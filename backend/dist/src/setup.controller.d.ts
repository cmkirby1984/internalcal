import { PrismaService } from './prisma/prisma.service';
export declare class SetupController {
    private prisma;
    constructor(prisma: PrismaService);
    createAdmin(): Promise<{
        success: boolean;
        message: string;
        username: string;
        password?: undefined;
        instructions?: undefined;
    } | {
        success: boolean;
        message: string;
        username: string;
        password: string;
        instructions: string;
    }>;
}
