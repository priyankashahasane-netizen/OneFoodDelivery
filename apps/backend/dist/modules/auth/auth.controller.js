var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Post } from '@nestjs/common';
import { Public } from './public.decorator.js';
import { CustomJwtService } from './jwt.service.js';
let AuthController = class AuthController {
    jwtService;
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    async login(body) {
        const user = process.env.ADMIN_USER ?? 'admin';
        const pass = process.env.ADMIN_PASS ?? 'admin';
        if (body.username !== user || body.password !== pass) {
            return { ok: false };
        }
        const tokenResponse = await this.jwtService.generateAdminToken(user);
        return {
            ok: true,
            access_token: tokenResponse.access_token,
            token: tokenResponse.token,
            expiresIn: tokenResponse.expiresIn,
            expiresAt: tokenResponse.expiresAt
        };
    }
};
__decorate([
    Public(),
    Post('login'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
AuthController = __decorate([
    Controller('auth'),
    __metadata("design:paramtypes", [CustomJwtService])
], AuthController);
export { AuthController };
