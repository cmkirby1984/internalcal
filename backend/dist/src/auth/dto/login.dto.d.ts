export declare class LoginDto {
    username: string;
    password: string;
}
export declare class LoginResponseDto {
    access_token: string;
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
