import { JwtService } from '@nestjs/jwt';
export declare class AuthController {
    private readonly jwt;
    constructor(jwt: JwtService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
        ok: boolean;
        access_token?: undefined;
    } | {
        ok: boolean;
        access_token: string;
    }>;
}
