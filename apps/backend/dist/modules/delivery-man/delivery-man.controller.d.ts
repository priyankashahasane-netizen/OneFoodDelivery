import { OrdersService } from '../orders/orders.service.js';
import { DriversService } from '../drivers/drivers.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
export declare class DeliveryManController {
    private readonly ordersService;
    private readonly driversService;
    private readonly shiftsService;
    constructor(ordersService: OrdersService, driversService: DriversService, shiftsService: ShiftsService);
    getAllOrders(offset?: string, limit?: string, status?: string, token?: string, req?: any): Promise<{
        orders: {
            id: number;
            user_id: any;
            order_amount: any;
            coupon_discount_amount: number;
            payment_status: string;
            order_status: string;
            total_tax_amount: number;
            payment_method: string;
            transaction_reference: any;
            delivery_address_id: any;
            delivery_man_id: string;
            order_type: string;
            restaurant_id: any;
            created_at: string;
            updated_at: string;
            delivery_charge: number;
            original_delivery_charge: number;
            dm_tips: number;
            schedule_at: any;
            restaurant_name: any;
            restaurant_discount_amount: number;
            restaurant_address: any;
            restaurant_lat: string;
            restaurant_lng: string;
            restaurant_logo_full_url: any;
            restaurant_phone: any;
            restaurant_delivery_time: any;
            vendor_id: any;
            details_count: number;
            order_note: any;
            delivery_address: {
                id: any;
                address_type: string;
                contact_person_number: any;
                address: any;
                latitude: string;
                longitude: string;
                zone_id: any;
                zone_ids: any;
                created_at: any;
                updated_at: any;
                user_id: any;
                contact_person_name: any;
                road: any;
                house: any;
                floor: any;
                postal_code: any;
                address_label: any;
            };
            customer: any;
            processing_time: any;
            chat_permission: any;
            restaurant_model: any;
            cutlery: boolean;
            unavailable_item_note: any;
            delivery_instruction: any;
            order_proof_full_url: any;
            payments: any;
            restaurant_discount: number;
            tax_status: boolean;
            additional_charge: number;
            extra_packaging_amount: number;
            ref_bonus_amount: number;
            bring_change_amount: number;
            external_ref: string;
            items: unknown[];
        }[];
        total_size: number;
        limit: string;
        offset: string;
        order_count: {
            all: number;
            delivered: number;
            canceled: number;
            refund_requested: number;
            refunded: number;
            refund_request_canceled: number;
        };
    }>;
    getShift(req: any): Promise<{
        id: string;
        name: string;
        shift_name: string;
        start_time: string;
        shift_start_time: string;
        end_time: string;
        shift_end_time: string;
        status: number;
        created_at: Date;
        updated_at: Date;
    }[] | {
        shift_name: unknown;
        shift_start_time: unknown;
        shift_end_time: unknown;
    }[]>;
    getNotifications(offset?: string, limit?: string, req?: any): Promise<{
        notifications: any[];
        total_size: number;
        limit: string;
        offset: string;
    }>;
    getWalletPaymentList(req: any): Promise<{
        wallet_payments: any[];
        total_size: number;
    }>;
    getWithdrawMethodList(req: any): Promise<{
        withdraw_methods: any[];
        total_size: number;
    }>;
    getMessageList(offset?: string, limit?: string, type?: string, req?: any): Promise<{
        conversations: any[];
        total_size: number;
        limit: string;
        offset: string;
        type: string;
    }>;
}
