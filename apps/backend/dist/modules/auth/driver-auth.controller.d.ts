import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { DriverEntity } from '../drivers/entities/driver.entity.js';
export declare class DriverOtpController {
    private readonly jwt;
    private readonly drivers;
    private readonly redis;
    constructor(jwt: JwtService, drivers: Repository<DriverEntity>, redis: any);
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
        error?: undefined;
    } | {
        ok: boolean;
        access_token: string;
        token: string;
        driverId: string;
        message?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        message: string;
        error: any;
        access_token?: undefined;
        token?: undefined;
        driverId?: undefined;
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
        delivery_man?: undefined;
        error?: undefined;
    } | {
        ok: boolean;
        token: string;
        access_token: string;
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
        delivery_man?: undefined;
    }>;
}
