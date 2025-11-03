import { Repository } from 'typeorm';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
import { CustomJwtService } from './jwt.service.js';
export declare class DriverOtpController {
    private readonly jwtService;
    private readonly drivers;
    private readonly redis;
    constructor(jwtService: CustomJwtService, drivers: Repository<DriverEntity>, redis: any);
    request(body: {
        phone: string;
    }): Promise<{
        ok: boolean;
        message: string;
        error?: undefined;
    } | {
        ok: boolean;
        message?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        message: string;
        error: any;
    }>;
    verify(body: {
        phone: string;
        code: string;
    }): Promise<{
        ok: boolean;
        message: string;
        access_token?: undefined;
        token?: undefined;
        driverId?: undefined;
        expiresIn?: undefined;
        expiresAt?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        access_token: string;
        token: string;
        driverId: string;
        expiresIn: number;
        expiresAt: Date;
        message?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        message: string;
        error: any;
        access_token?: undefined;
        token?: undefined;
        driverId?: undefined;
        expiresIn?: undefined;
        expiresAt?: undefined;
    }>;
    private isRedisAvailable;
    legacyLogin(body: {
        phone: string;
        password: string;
    }): Promise<{
        ok: boolean;
        message: string;
        token?: undefined;
        access_token?: undefined;
        expiresIn?: undefined;
        expiresAt?: undefined;
        delivery_man?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        token: string;
        access_token: string;
        expiresIn: number;
        expiresAt: Date;
        delivery_man: {
            id: string;
            phone: string;
            name: string;
        };
        message?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        message: string;
        error: any;
        token?: undefined;
        access_token?: undefined;
        expiresIn?: undefined;
        expiresAt?: undefined;
        delivery_man?: undefined;
    }>;
}
