export class DriverProfileResponseDto {
    id;
    name;
    f_name;
    l_name;
    phone;
    email;
    vehicle_type;
    capacity;
    online;
    active;
    zone_id;
    created_at;
    updated_at;
    balance;
    cash_in_hands;
    todays_earning;
    this_week_earning;
    this_month_earning;
    payable_balance;
    Payable_Balance;
    withdraw_able_balance;
    total_withdrawn;
    total_incentive_earning;
    earning;
    order_count;
    todays_order_count;
    this_week_order_count;
    image_full_url;
    fcm_token;
    identity_number;
    identity_type;
    identity_image;
    avg_rating;
    rating_count;
    member_since_days;
    shift_name;
    shift_start_time;
    shift_end_time;
    type;
    adjust_able;
    over_flow_warning;
    over_flow_block_warning;
    show_pay_now_button;
    incentive_list;
    static fromDriverEntity(driver) {
        const memberSinceDays = driver.createdAt
            ? Math.floor((Date.now() - new Date(driver.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 180;
        const nameParts = (driver.name || 'Demo Driver').split(' ');
        const fName = nameParts[0] || 'Demo';
        const lName = nameParts.slice(1).join(' ') || 'Driver';
        const numericId = driver.id ? this.uuidToNumericId(driver.id) : 1;
        const createdAt = driver.createdAt
            ? (driver.createdAt instanceof Date ? driver.createdAt.toISOString() : new Date(driver.createdAt).toISOString())
            : new Date().toISOString();
        const updatedAt = driver.updatedAt
            ? (driver.updatedAt instanceof Date ? driver.updatedAt.toISOString() : new Date(driver.updatedAt).toISOString())
            : new Date().toISOString();
        const metadata = driver.metadata || {};
        const zoneIdStr = driver.zoneId ? String(driver.zoneId) : '1';
        const response = {
            id: numericId,
            name: driver.name ?? 'Demo Driver',
            f_name: fName,
            l_name: lName,
            phone: driver.phone ?? '+919975008124',
            email: metadata.email ?? 'demo.driver@example.com',
            vehicle_type: driver.vehicleType ?? 'bike',
            capacity: driver.capacity ?? 5,
            online: driver.online ?? false,
            active: driver.online ? 1 : 0,
            zone_id: zoneIdStr,
            created_at: createdAt,
            updated_at: updatedAt,
            balance: metadata.balance ?? 1250.75,
            cash_in_hands: metadata.cashInHands ?? 125.50,
            todays_earning: metadata.todaysEarning ?? 125.50,
            this_week_earning: metadata.thisWeekEarning ?? 875.25,
            this_month_earning: metadata.thisMonthEarning ?? 3250.00,
            payable_balance: metadata.payableBalance ?? 1250.75,
            Payable_Balance: metadata.payableBalance ?? 1250.75,
            withdraw_able_balance: metadata.withDrawableBalance ?? 1000.00,
            total_withdrawn: metadata.totalWithdrawn ?? 5000.00,
            total_incentive_earning: metadata.totalIncentiveEarning ?? 150.00,
            earning: metadata.earnings ?? 1,
            order_count: metadata.orderCount ?? 342,
            todays_order_count: metadata.todaysOrderCount ?? 8,
            this_week_order_count: metadata.thisWeekOrderCount ?? 45,
            image_full_url: metadata.imageFullUrl ?? '',
            fcm_token: metadata.fcmToken ?? '',
            identity_number: metadata.identityNumber ?? '',
            identity_type: metadata.identityType ?? '',
            identity_image: metadata.identityImage ?? '',
            avg_rating: metadata.avgRating != null ? Number(metadata.avgRating) : 4.8,
            rating_count: metadata.ratingCount != null ? Number(metadata.ratingCount) : 125,
            member_since_days: metadata.memberSinceDays != null ? Number(metadata.memberSinceDays) : memberSinceDays,
            shift_name: metadata.shiftName ?? 'Morning Shift',
            shift_start_time: metadata.shiftStartTime ?? '08:00:00',
            shift_end_time: metadata.shiftEndTime ?? '16:00:00',
            type: metadata.type ?? 'free_zone',
            adjust_able: metadata.adjustable ?? true,
            over_flow_warning: metadata.overFlowWarning ?? false,
            over_flow_block_warning: metadata.overFlowBlockWarning ?? false,
            show_pay_now_button: metadata.showPayNowButton ?? false,
            incentive_list: metadata.incentiveList || [],
        };
        return response;
    }
    static uuidToNumericId(uuid) {
        let hash = 0;
        for (let i = 0; i < uuid.length; i++) {
            const char = uuid.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash % 2147483647) || 1;
    }
}
