# Backend Profile Fields Added

## Summary
Added all missing profile fields to the backend API response with mock values. The backend now returns a complete profile that matches frontend expectations.

## Changes Made

### 1. Created `DriverProfileResponseDto`
**File**: `apps/backend/src/modules/drivers/dto/driver-profile-response.dto.ts`

- New DTO class that enriches `DriverEntity` with all fields expected by frontend
- Includes 41 fields total (12 from database + 29 mock fields)
- Static method `fromDriverEntity()` automatically populates mock values

### 2. Updated `DriversService`
**File**: `apps/backend/src/modules/drivers/drivers.service.ts`

- Added `getProfile()` method that returns enriched profile data
- Uses `DriverProfileResponseDto.fromDriverEntity()` to add mock values

### 3. Updated `DriversController`
**File**: `apps/backend/src/modules/drivers/drivers.controller.ts`

- `GET /api/drivers/me` now returns enriched profile via `getProfile()`
- Returns all fields expected by frontend with proper field names

### 4. Updated Demo Account Creation
**File**: `apps/backend/src/database/seeds/create-demo-account.ts`

- Demo account now includes all mock profile data in `metadata` field
- Mock values stored in database for persistence

## Mock Values Provided

### Financial Fields:
- `balance`: 1250.75
- `cash_in_hands`: 125.50
- `todays_earning`: 125.50
- `this_week_earning`: 875.25
- `this_month_earning`: 3250.00
- `payable_balance`: 1250.75
- `withdraw_able_balance`: 1000.00
- `total_withdrawn`: 5000.00
- `total_incentive_earning`: 150.00
- `earning`: 1 (enabled)

### Order Statistics:
- `order_count`: 342
- `todays_order_count`: 8
- `this_week_order_count`: 45

### Profile Information:
- `email`: demo.driver@example.com
- `image_full_url`: null
- `fcm_token`: null
- `identity_number`: null
- `identity_type`: null
- `identity_image`: null

### Ratings:
- `avg_rating`: 4.8
- `rating_count`: 125
- `member_since_days`: Calculated from createdAt (or 180 default)

### Shifts:
- `shift_name`: "Morning Shift"
- `shift_start_time`: "08:00:00"
- `shift_end_time`: "16:00:00"

### Other:
- `type`: "free_zone"
- `adjust_able`: true
- `over_flow_warning`: false
- `over_flow_block_warning`: false
- `show_pay_now_button`: false
- `incentive_list`: []

## Field Name Mapping

The DTO uses snake_case to match frontend expectations:
- `f_name`, `l_name` (split from `name`)
- `active` (converted from `online` boolean)
- `cash_in_hands`, `todays_earning`, `this_week_earning`, etc.
- `Payable_Balance` (capitalized as frontend expects)

## API Response Format

```json
{
  "id": "uuid-string",
  "f_name": "Demo",
  "l_name": "Driver",
  "phone": "+919975008124",
  "email": "demo.driver@example.com",
  "active": 0,
  "online": false,
  "balance": 1250.75,
  "cash_in_hands": 125.50,
  "earnings": 1,
  "order_count": 342,
  "todays_order_count": 8,
  "this_week_order_count": 45,
  "todays_earning": 125.50,
  "this_week_earning": 875.25,
  "this_month_earning": 3250.00,
  "Payable_Balance": 1250.75,
  "avg_rating": 4.8,
  "rating_count": 125,
  "member_since_days": 180,
  "shift_name": "Morning Shift",
  "shift_start_time": "08:00:00",
  "shift_end_time": "16:00:00",
  ... (all other fields)
}
```

## Testing

1. Run the demo account creation script:
   ```bash
   cd apps/backend
   npm run create-demo-account
   ```

2. Start the backend:
   ```bash
   npm run start:dev
   ```

3. Login with demo credentials and verify profile API returns all fields:
   - Phone: `9975008124` or `+919975008124`
   - Password: `Pri@0110`
   - Endpoint: `GET /api/drivers/me` (requires JWT auth)

## Benefits

✅ No more null values in profile response  
✅ Frontend receives complete profile data  
✅ Demo account has realistic mock data  
✅ No null check errors in home screen  
✅ All fields match frontend ProfileModel expectations  

## Next Steps

For production, replace mock values with:
- Real calculations from order service (order counts, earnings)
- Real financial data from wallet/payment service
- Real profile data from user service
- Real rating calculations from review service

