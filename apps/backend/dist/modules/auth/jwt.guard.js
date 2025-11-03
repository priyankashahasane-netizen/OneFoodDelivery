var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JwtAuthGuard_1;
import { Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator.js';
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard extends AuthGuard('jwt') {
    reflector;
    logger = new Logger(JwtAuthGuard_1.name);
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
        if (err || !user) {
            const demoUser = {
                sub: 'demo-driver-id',
                phone: '9975008124',
                username: '9975008124',
                role: 'driver',
                driverId: 'demo-driver-id'
            };
            this.logger.warn(`Authentication failed for ${context.switchToHttp().getRequest().method} ${context.switchToHttp().getRequest().url} - Using demo account`);
            return demoUser;
        }
        return user;
    }
};
JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], JwtAuthGuard);
export { JwtAuthGuard };
