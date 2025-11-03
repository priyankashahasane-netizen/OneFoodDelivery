import { CustomJwtService } from './jwt.service.js';
export declare class AuthController {
    private readonly jwtService;
    constructor(jwtService: CustomJwtService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        ok: boolean;
        access_token?: undefined;
        token?: undefined;
        expiresIn?: undefined;
        expiresAt?: undefined;
    } | {
        ok: boolean;
        access_token: string;
        token: string;
        expiresIn: number;
        expiresAt: Date;
    }>;
}
