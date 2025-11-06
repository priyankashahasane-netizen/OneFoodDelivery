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
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
export class CoordinateDto {
    lat;
    lng;
    address;
}
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lat", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], CoordinateDto.prototype, "lng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CoordinateDto.prototype, "address", void 0);
export var PaymentType;
(function (PaymentType) {
    PaymentType["Cod"] = "cash_on_delivery";
    PaymentType["Prepaid"] = "prepaid";
    PaymentType["Partial"] = "partial";
})(PaymentType || (PaymentType = {}));
export class UpsertOrderDto {
    externalRef;
    pickup;
    dropoff;
    paymentType;
    status;
    items;
    slaSeconds;
    trackingUrl;
    zoneId;
    subscriptionId;
    cancellationSource;
    cancellationReason;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "externalRef", void 0);
__decorate([
    Type(() => CoordinateDto),
    ValidateNested(),
    __metadata("design:type", CoordinateDto)
], UpsertOrderDto.prototype, "pickup", void 0);
__decorate([
    Type(() => CoordinateDto),
    ValidateNested(),
    __metadata("design:type", CoordinateDto)
], UpsertOrderDto.prototype, "dropoff", void 0);
__decorate([
    IsEnum(PaymentType),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "paymentType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "status", void 0);
__decorate([
    IsArray(),
    IsOptional(),
    __metadata("design:type", Array)
], UpsertOrderDto.prototype, "items", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", Number)
], UpsertOrderDto.prototype, "slaSeconds", void 0);
__decorate([
    IsOptional(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "trackingUrl", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "zoneId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "subscriptionId", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "cancellationSource", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpsertOrderDto.prototype, "cancellationReason", void 0);
