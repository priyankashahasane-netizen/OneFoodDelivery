var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from '@nestjs/common';
import { Public } from '../../modules/auth/public.decorator.js';
let ConfigController = class ConfigController {
    getConfig() {
        return {
            business_name: 'Stack Delivery',
            logo: '',
            address: '',
            phone: '',
            email: '',
            currency_symbol: '',
            cash_on_delivery: true,
            digital_payment: true,
            terms_and_conditions: '',
            privacy_policy: '',
            about_us: '',
            country: 'US',
            default_location: {
                lat: '0',
                lng: '0',
            },
            app_url_android_deliveryman: '',
            app_url_ios_deliveryman: '',
            customer_verification: false,
            order_delivery_verification: false,
            currency_symbol_direction: 'left',
            app_minimum_version_android_deliveryman: 1.0,
            free_delivery_over: null,
            demo: false,
            maintenance_mode: false,
            popular_food: 0,
            popular_restaurant: 0,
            new_restaurant: 0,
            order_confirmation_model: 'deliveryman',
            show_dm_earning: true,
            canceled_by_deliveryman: true,
            canceled_by_restaurant: true,
            timeformat: '12',
            toggle_veg_non_veg: false,
            toggle_dm_registration: true,
            toggle_restaurant_registration: false,
            schedule_order_slot_duration: 30,
            digit_after_decimal_point: 2,
            additional_charge_name: '',
            dm_picture_upload_status: 0,
            active_payment_method_list: [],
            deliveryman_additional_join_us_page_data: null,
            disbursement_type: 'manual',
            min_amount_to_pay_dm: 0,
            maintenance_mode_data: null,
            firebase_otp_verification: false,
        };
    }
};
__decorate([
    Public(),
    Get('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "getConfig", null);
ConfigController = __decorate([
    Controller('v1')
], ConfigController);
export { ConfigController };
