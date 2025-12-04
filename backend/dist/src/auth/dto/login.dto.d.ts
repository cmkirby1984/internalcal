export declare class LoginDto {
    username: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LoginResponseDto {
    token: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        permissions: string[];
    };
}
