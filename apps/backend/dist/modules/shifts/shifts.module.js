var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftsController } from './shifts.controller.js';
import { ShiftsService } from './shifts.service.js';
import { ShiftEntity } from './entities/shift.entity.js';
let ShiftsModule = class ShiftsModule {
};
ShiftsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([ShiftEntity])],
        controllers: [ShiftsController],
        providers: [ShiftsService],
        exports: [ShiftsService]
    })
], ShiftsModule);
export { ShiftsModule };
