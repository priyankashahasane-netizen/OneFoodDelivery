var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
class OptimizeStopDto {
    lat;
    lng;
    orderId;
}
__decorate([
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], OptimizeStopDto.prototype, "lat", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], OptimizeStopDto.prototype, "lng", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], OptimizeStopDto.prototype, "orderId", void 0);
export class OptimizeRouteDto {
    driverId;
    stops;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], OptimizeRouteDto.prototype, "driverId", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    Type(() => OptimizeStopDto),
    ValidateNested({ each: true }),
    __metadata("design:type", Array)
], OptimizeRouteDto.prototype, "stops", void 0);
