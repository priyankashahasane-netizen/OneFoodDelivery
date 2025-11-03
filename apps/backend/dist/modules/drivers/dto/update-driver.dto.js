var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
export class UpdateDriverDto {
    name;
    phone;
    vehicleType;
    capacity;
    online;
    latitude;
    longitude;
    zoneId;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDriverDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDriverDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDriverDto.prototype, "vehicleType", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    Max(10),
    __metadata("design:type", Number)
], UpdateDriverDto.prototype, "capacity", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], UpdateDriverDto.prototype, "online", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateDriverDto.prototype, "latitude", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], UpdateDriverDto.prototype, "longitude", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDriverDto.prototype, "zoneId", void 0);
