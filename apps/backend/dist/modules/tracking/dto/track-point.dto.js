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
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
export class TrackPointDto {
    driverId;
    lat;
    lng;
    speed;
    heading;
    ts;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], TrackPointDto.prototype, "driverId", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], TrackPointDto.prototype, "lat", void 0);
__decorate([
    Type(() => Number),
    IsNumber(),
    __metadata("design:type", Number)
], TrackPointDto.prototype, "lng", void 0);
__decorate([
    Type(() => Number),
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], TrackPointDto.prototype, "speed", void 0);
__decorate([
    Type(() => Number),
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], TrackPointDto.prototype, "heading", void 0);
__decorate([
    IsOptional(),
    IsISO8601(),
    __metadata("design:type", String)
], TrackPointDto.prototype, "ts", void 0);
