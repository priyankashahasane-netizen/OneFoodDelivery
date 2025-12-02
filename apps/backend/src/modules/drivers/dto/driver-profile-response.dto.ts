/**
 * Driver Profile Response DTO
 * Enriches DriverEntity with all fields expected by frontend ProfileModel
 * Includes mock values for fields not stored in database
 */
export class DriverProfileResponseDto {
  // Basic driver info (from DriverEntity)
  id: string | number;
  uuid?: string; // Actual UUID from database for API operations
  name?: string;
  f_name?: string;
  l_name?: string;
  phone: string;
  email?: string;
  vehicle_type?: string;
  capacity?: number;
  online: boolean;
  active?: number; // Converted from online
  is_active?: boolean; // GIS registration status
  is_verified?: boolean; // Driver verification status
  zone_id?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;

  // Financial fields (mock values for now)
  balance?: number;
  cash_in_hands?: number;
  todays_earning?: number;
  this_week_earning?: number;
  this_month_earning?: number;
  payable_balance?: number;
  Payable_Balance?: number; // Frontend expects this format
  withdraw_able_balance?: number;
  total_withdrawn?: number;
  total_incentive_earning?: number;
  earning?: number; // Flag for earnings feature (1 = enabled, 0 = disabled)

  // Order statistics (mock values for now)
  order_count?: number;
  todays_order_count?: number;
  this_week_order_count?: number;

  // Profile information
  image_full_url?: string | null;
  fcm_token?: string | null;
  identity_number?: string | null;
  identity_type?: string | null;
  identity_image?: string | null;

  // Current location (from DriverEntity)
  latitude?: number | null;
  longitude?: number | null;

  // Home address
  home_address?: string | null;
  home_address_latitude?: number | null;
  home_address_longitude?: number | null;

  // Ratings
  avg_rating?: number;
  rating_count?: number;
  member_since_days?: number;

  // Shifts
  shift_name?: string;
  shift_start_time?: string;
  shift_end_time?: string;

  // Other
  type?: string;
  adjust_able?: boolean;
  over_flow_warning?: boolean;
  over_flow_block_warning?: boolean;
  show_pay_now_button?: boolean;
  incentive_list?: any[];

  /**
   * Enriches a DriverEntity with mock profile data
   * Ensures ALL fields have non-null values to prevent frontend null errors
   * @param driver - The driver entity
   * @param walletBalance - The balance from driver_wallets table (optional, falls back to metadata or default)
   * @param orderCounts - The order counts from orders table (optional, falls back to metadata or default)
   */
  static fromDriverEntity(
    driver: any, 
    walletBalance?: number | null,
    orderCounts?: { total: number; today: number; thisWeek: number } | null
  ): DriverProfileResponseDto {
    // Calculate days since creation from created_at field
    // Try both camelCase (TypeORM default) and snake_case (raw DB) property names
    const createdAtValue = driver.createdAt || driver.created_at || (driver as any)['created_at'];
    
    let memberSinceDays = 0;
    if (createdAtValue) {
      try {
        const createdAt = new Date(createdAtValue);
        // Check if date is valid
        if (isNaN(createdAt.getTime())) {
          console.warn(`Driver ${driver.id} has invalid created_at date: ${createdAtValue}`);
          memberSinceDays = 0;
        } else {
          const now = new Date();
          const diffTime = now.getTime() - createdAt.getTime();
          memberSinceDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          // Ensure non-negative value
          if (memberSinceDays < 0) {
            memberSinceDays = 0;
          }
          console.log(`Driver ${driver.id} - created_at: ${createdAt.toISOString()}, days since: ${memberSinceDays}`);
        }
      } catch (error) {
        console.error(`Error calculating days since creation for driver ${driver.id}:`, error);
        memberSinceDays = 0;
      }
    } else {
      // Fallback only if created_at is truly missing
      console.warn(`Driver ${driver.id} missing created_at field. Available properties: ${Object.keys(driver).join(', ')}`);
      memberSinceDays = 0;
    }

    // Split name into first and last
    const nameParts = (driver.name || 'Demo Driver').split(' ');
    const fName = nameParts[0] || 'Demo';
    const lName = nameParts.slice(1).join(' ') || 'Driver';

    // Convert UUID to numeric ID (use hash of UUID for consistency)
    const numericId = driver.id ? this.uuidToNumericId(driver.id) : 1;

    // Format dates as ISO strings
    const createdAt = driver.createdAt 
      ? (driver.createdAt instanceof Date ? driver.createdAt.toISOString() : new Date(driver.createdAt).toISOString())
      : new Date().toISOString();
    const updatedAt = driver.updatedAt
      ? (driver.updatedAt instanceof Date ? driver.updatedAt.toISOString() : new Date(driver.updatedAt).toISOString())
      : new Date().toISOString();

    // Get metadata or use empty object
    const metadata = driver.metadata || {};

    // Convert zone_id to string for consistency (frontend will parse as int)
    const zoneIdStr = driver.zoneId ? String(driver.zoneId) : '1';

    // Build response object ensuring all fields have values - NO NULL VALUES
    const response: DriverProfileResponseDto = {
      // Basic info - ensure no nulls
      id: numericId,
      uuid: driver.id || undefined, // Include actual UUID for API operations
      name: driver.name ?? 'Demo Driver',
      f_name: fName,
      l_name: lName,
      phone: driver.phone ?? '+919975008124',
      email: metadata.email ?? 'demo.driver@example.com',
      vehicle_type: driver.vehicleType ?? 'bike',
      capacity: driver.capacity ?? 5,
      online: driver.online ?? false,
      active: driver.online ? 1 : 0,
      // Preserve the actual isActive value from database
      // TypeORM boolean columns always return true/false, never undefined
      is_active: driver.isActive ?? true,  // Default to true if somehow undefined
      is_verified: driver.isVerified ?? false,  // Default to false if somehow undefined - show registration form
      zone_id: zoneIdStr,
      created_at: createdAt,
      updated_at: updatedAt,

      // Financial fields - ensure no nulls
      // Use wallet balance from database if available, otherwise fall back to metadata or default
      balance: walletBalance !== null && walletBalance !== undefined ? walletBalance : (metadata.balance ?? 0.0),
      cash_in_hands: metadata.cashInHands ?? 125.50,
      todays_earning: metadata.todaysEarning ?? 125.50,
      this_week_earning: metadata.thisWeekEarning ?? 875.25,
      this_month_earning: metadata.thisMonthEarning ?? 3250.00,
      // Use wallet balance for payable_balance since that's what the driver can withdraw
      payable_balance: walletBalance !== null && walletBalance !== undefined ? walletBalance : (metadata.payableBalance ?? 0.0),
      Payable_Balance: walletBalance !== null && walletBalance !== undefined ? walletBalance : (metadata.payableBalance ?? 0.0), // Frontend expects this format
      withdraw_able_balance: metadata.withDrawableBalance ?? 1000.00,
      total_withdrawn: metadata.totalWithdrawn ?? 5000.00,
      total_incentive_earning: metadata.totalIncentiveEarning ?? 150.00,
      earning: metadata.earnings ?? 1, // Enable earnings feature

      // Order statistics - use database counts if available, otherwise fall back to metadata or defaults
      order_count: orderCounts?.total ?? (metadata.orderCount ?? 0),
      todays_order_count: orderCounts?.today ?? (metadata.todaysOrderCount ?? 0),
      this_week_order_count: orderCounts?.thisWeek ?? (metadata.thisWeekOrderCount ?? 0),

      // Profile information - use empty strings instead of null
      image_full_url: metadata.imageFullUrl ?? '',
      fcm_token: metadata.fcmToken ?? '',
      identity_number: metadata.identityNumber ?? '',
      identity_type: metadata.identityType ?? '',
      identity_image: metadata.identityImage ?? '',

      // Current location (from DriverEntity)
      latitude: driver.latitude ?? null,
      longitude: driver.longitude ?? null,

      // Home address
      home_address: driver.homeAddress ?? null,
      home_address_latitude: driver.homeAddressLatitude ?? null,
      home_address_longitude: driver.homeAddressLongitude ?? null,

      // Ratings - ensure no nulls
      avg_rating: metadata.avgRating != null ? Number(metadata.avgRating) : 4.8,
      rating_count: metadata.ratingCount != null ? Number(metadata.ratingCount) : 125,
      // Always use calculated value from created_at field, not metadata
      member_since_days: memberSinceDays,

      // Shifts - ensure no nulls
      shift_name: metadata.shiftName ?? 'Morning Shift',
      shift_start_time: metadata.shiftStartTime ?? '08:00:00',
      shift_end_time: metadata.shiftEndTime ?? '16:00:00',

      // Other - ensure no nulls
      type: metadata.type ?? 'free_zone',
      adjust_able: metadata.adjustable ?? true,
      over_flow_warning: metadata.overFlowWarning ?? false,
      over_flow_block_warning: metadata.overFlowBlockWarning ?? false,
      show_pay_now_button: metadata.showPayNowButton ?? false,
      incentive_list: metadata.incentiveList || [],
    };

    return response;
  }

  /**
   * Convert UUID to numeric ID (for compatibility with frontend)
   * Uses a simple hash function to get consistent numeric value
   */
  private static uuidToNumericId(uuid: string): number {
    // Simple hash function to convert UUID to number
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
      const char = uuid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Return positive number between 1 and max safe integer
    return Math.abs(hash % 2147483647) || 1;
  }
}
