var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNumber, IsArray, IsEnum, IsObject, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
class LocationDto {
    lat;
    lng;
    address;
}
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], LocationDto.prototype, "lat", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], LocationDto.prototype, "lng", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], LocationDto.prototype, "address", void 0);
class OrderItemDto {
    name;
    quantity;
    price;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "name", void 0);
__decorate([
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "quantity", void 0);
__decorate([
    IsNumber(),
    Min(0),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "price", void 0);
export class CreateOrderFromWebhookDto {
    platform;
    externalRef;
    pickup;
    dropoff;
    items;
    paymentType;
    customerPhone;
    customerName;
    slaMinutes;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOrderFromWebhookDto.prototype, "platform", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOrderFromWebhookDto.prototype, "externalRef", void 0);
__decorate([
    IsObject(),
    ValidateNested(),
    Type(() => LocationDto),
    __metadata("design:type", LocationDto)
], CreateOrderFromWebhookDto.prototype, "pickup", void 0);
__decorate([
    IsObject(),
    ValidateNested(),
    Type(() => LocationDto),
    __metadata("design:type", LocationDto)
], CreateOrderFromWebhookDto.prototype, "dropoff", void 0);
__decorate([
    IsArray(),
    ValidateNested({ each: true }),
    Type(() => OrderItemDto),
    __metadata("design:type", Array)
], CreateOrderFromWebhookDto.prototype, "items", void 0);
__decorate([
    IsEnum(['cash', 'online']),
    __metadata("design:type", String)
], CreateOrderFromWebhookDto.prototype, "paymentType", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateOrderFromWebhookDto.prototype, "customerPhone", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateOrderFromWebhookDto.prototype, "customerName", void 0);
__decorate([
    IsNumber(),
    Min(1),
    __metadata("design:type", Number)
], CreateOrderFromWebhookDto.prototype, "slaMinutes", void 0);
