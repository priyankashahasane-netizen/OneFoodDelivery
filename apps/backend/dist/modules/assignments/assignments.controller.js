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
import { Body, Controller, Post, Request } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { AssignmentsService } from './assignments.service.js';
import { AssignOrderDto } from './dto/assign-order.dto.js';
let AssignmentsController = class AssignmentsController {
    assignmentsService;
    constructor(assignmentsService) {
        this.assignmentsService = assignmentsService;
    }
    async assign(payload, req) {
        if (!payload.driverId) {
            payload.driverId = req.user?.sub || req.user?.driverId;
        }
        return this.assignmentsService.assign(payload);
    }
};
__decorate([
    Post('assign'),
    UseGuards(JwtAuthGuard),
    __param(0, Body()),
    __param(1, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AssignOrderDto, Object]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "assign", null);
AssignmentsController = __decorate([
    Controller('assignments'),
    __metadata("design:paramtypes", [AssignmentsService])
], AssignmentsController);
export { AssignmentsController };
