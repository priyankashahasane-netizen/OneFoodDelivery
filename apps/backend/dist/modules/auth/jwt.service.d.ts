import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export interface TokenPayload {
    sub: string;
    username?: string;
    phone?: string;
    role: 'admin' | 'driver';
    iat?: number;
    exp?: number;
}
export interface TokenResponse {
    access_token: string;
    token: string;
    expiresIn: number;
    expiresAt: Date;
}
export declare class CustomJwtService {
    private readonly jwtService;
    private readonly configService;
    private readonly jwtSecret;
    private readonly tokenExpiration;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateToken(payload: TokenPayload): Promise<TokenResponse>;
    generateAdminToken(username: string): Promise<TokenResponse>;
    generateDriverToken(driverId: string, phone: string): Promise<TokenResponse>;
    verifyToken(token: string): Promise<TokenPayload | null>;
    private parseExpiration;
    getSecret(): string;
    isUsingDefaultSecret(): boolean;
}
