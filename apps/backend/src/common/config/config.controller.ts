import { Controller, Get } from '@nestjs/common';
import { Public } from '../../modules/auth/public.decorator.js';

@Controller('v1')
export class ConfigController {
  @Public()
  @Get('config')
  getConfig() {
    // Return minimal default config to allow app initialization
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
      cancelled_by_deliveryman: true,
      cancelled_by_restaurant: true,
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
}

