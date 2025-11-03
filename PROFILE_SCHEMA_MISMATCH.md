# Profile Schema Mismatch Analysis

## Problem
The backend `DriverEntity` returns only basic driver information, but the frontend `ProfileModel` expects many additional fields that the backend doesn't provide. This causes null values and potential crashes.

## Backend Schema (DriverEntity)
The backend API endpoint `GET /api/drivers/me` returns:

```typescript
{
  id: string,                    // UUID
  name: string,                  // Full name (not f_name/l_name)
  phone: string,
  vehicleType: string,
  capacity: number,
  online: boolean,               // Not "active" (int)
  latitude: number | null,
  longitude: number | null,
  lastSeenAt: Date | null,
  ipAddress: string | null,
  metadata: Record<string, unknown> | null,  // JSON field
  zoneId: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Schema (ProfileModel) - Expected Fields
The frontend expects 41 fields, but backend only provides ~12:

### ✅ Fields Backend Provides (mapped):
- `id` → Maps correctly (UUID to int may cause issues)
- `name` → Split into `fName`/`lName` 
- `phone` → Maps correctly
- `online` → Converted to `active` (boolean to int)
- `zoneId` → Maps correctly
- `createdAt` → Maps correctly
- `updatedAt` → Maps correctly

### ❌ Fields Backend MISSING (will be null):
**Earnings & Financial:**
- `balance` (double)
- `cashInHands` (double)
- `todaysEarning` (double)
- `thisWeekEarning` (double)
- `thisMonthEarning` (double)
- `payableBalance` (double)
- `withDrawableBalance` (double)
- `totalWithdrawn` (double)
- `totalIncentiveEarning` (double)
- `earnings` (int) - Flag for earnings feature

**Order Statistics:**
- `orderCount` (int)
- `todaysOrderCount` (int)
- `thisWeekOrderCount` (int)

**Profile Information:**
- `fName` (string) - Derived from `name`
- `lName` (string) - Derived from `name`
- `email` (string)
- `identityNumber` (string)
- `identityType` (string)
- `identityImage` (string)
- `imageFullUrl` (string)
- `fcmToken` (string)

**Ratings:**
- `avgRating` (double)
- `ratingCount` (int)
- `memberSinceDays` (int)

**Shifts:**
- `shiftName` (string)
- `shiftStartTime` (string)
- `shiftEndTime` (string)

**Other:**
- `type` (string)
- `adjustable` (bool)
- `overFlowWarning` (bool)
- `overFlowBlockWarning` (bool)
- `showPayNowButton` (bool)
- `incentiveList` (List<IncentiveList>)

## Current Solution
The `ProfileController` has:
1. `_mergeProfileWithDefaults()` - Merges API data with demo data
2. `_getDemoProfile()` - Provides default values for all fields
3. Uses demo data when API returns null or on error

## Fields Used in Home Screen (Potential Null Issues)
Based on `home_screen.dart`, these fields are accessed:
- ✅ `active` - Maps from `online` ✓
- ❌ `earnings` - Not in backend (default: 0)
- ❌ `balance` - Not in backend (default: 0.0)
- ❌ `cashInHands` - Not in backend (default: 0.0)
- ❌ `todaysEarning` - Not in backend (default: 0.0)
- ❌ `thisWeekEarning` - Not in backend (default: 0.0)
- ❌ `thisMonthEarning` - Not in backend (default: 0.0)
- ❌ `todaysOrderCount` - Not in backend (default: 0)
- ❌ `thisWeekOrderCount` - Not in backend (default: 0)
- ❌ `orderCount` - Not in backend (default: 0)

## Recommendations

### Option 1: Update Backend (Recommended)
Add missing fields to `DriverEntity` or create a separate service that calculates:
- Order statistics (orderCount, todaysOrderCount, etc.)
- Financial data (balance, earnings, etc.)
- Profile details (email, image, etc.)

### Option 2: Use Demo Data (Current)
Continue using demo data fallback, but ensure all UI code handles nulls safely.

### Option 3: Mock API Response
Create a mock endpoint that returns all expected fields for development/testing.

## Schema Mapping Issues

1. **ID Type Mismatch**: Backend uses UUID (string), frontend expects int
2. **Name Format**: Backend has `name`, frontend expects `f_name`/`l_name`
3. **Active Status**: Backend has `online` (boolean), frontend expects `active` (int 0/1)

These are already handled in `ProfileModel.fromJson()`.

