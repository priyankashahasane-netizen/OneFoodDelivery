# JWT Token Management

This document explains how to use the new JWT token system in the Stack Delivery backend.

## Overview

The backend now uses a centralized `CustomJwtService` for generating and managing JWT tokens. This provides:
- Consistent token generation across all endpoints
- Better security practices
- Token expiration management
- Easy token verification

## Generating a Secure JWT Secret

**Important**: Always use a strong, random secret in production. Never use the default `dev-secret`.

### Option 1: Using the Generation Script (Recommended)

```bash
cd apps/backend
node scripts/generate-jwt-secret.js
```

This will generate a secure 64-byte hex string. Copy the output and add it to your `.env` file:

```env
JWT_SECRET=your-generated-secret-here
```

### Option 2: Manual Generation

You can also generate a secret using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Using the JWT Service

### In Controllers

The `CustomJwtService` is available in the `AuthModule` and can be injected into any controller:

```typescript
import { CustomJwtService } from './auth/jwt.service.js';

@Controller('example')
export class ExampleController {
  constructor(private readonly jwtService: CustomJwtService) {}

  @Post('generate-token')
  async generateToken() {
    // Generate token for admin
    const adminToken = await this.jwtService.generateAdminToken('admin');
    
    // Generate token for driver
    const driverToken = await this.jwtService.generateDriverToken('driver-id', '+1234567890');
    
    // Generate custom token
    const customToken = await this.jwtService.generateToken({
      sub: 'user-id',
      username: 'john_doe',
      role: 'driver'
    });
    
    return customToken;
  }
}
```

### Token Response Format

All token generation methods return a `TokenResponse` object:

```typescript
{
  access_token: string;  // JWT token string
  token: string;         // Same as access_token (for backward compatibility)
  expiresIn: number;     // Expiration time in seconds
  expiresAt: Date;       // Exact expiration date
}
```

### Token Verification

You can verify tokens using the service:

```typescript
const payload = await this.jwtService.verifyToken(token);
if (payload) {
  console.log('Valid token for user:', payload.sub);
} else {
  console.log('Invalid or expired token');
}
```

## API Endpoints

### Admin Login

```bash
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

Response:
```json
{
  "ok": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000,
  "expiresAt": "2024-02-15T12:00:00.000Z"
}
```

### Driver OTP Login

```bash
POST /auth/driver/otp/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "code": "123456"
}
```

Response:
```json
{
  "ok": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driverId": "uuid-here",
  "expiresIn": 2592000,
  "expiresAt": "2024-02-15T12:00:00.000Z"
}
```

## Environment Variables

Configure JWT settings in your `.env` file:

```env
# Required: Secure JWT secret (use generate-jwt-secret.js)
JWT_SECRET=your-secure-secret-here

# Optional: Token expiration (default: 30d)
# Formats: 30d, 7d, 24h, 3600s, etc.
JWT_EXPIRATION=30d
```

## Security Best Practices

1. **Never commit secrets**: Always keep `JWT_SECRET` in `.env` and ensure `.env` is in `.gitignore`
2. **Use strong secrets**: Generate secrets using the provided script
3. **Rotate secrets periodically**: In production, rotate JWT secrets regularly
4. **Check for default secret**: The service includes `isUsingDefaultSecret()` to warn if using dev-secret
5. **Monitor token expiration**: Tokens expire in 30 days by default; adjust based on your security needs

## Token Structure

JWT tokens contain the following payload:

```typescript
{
  sub: string;        // User ID (admin or driver ID)
  username?: string;  // Admin username (for admin tokens)
  phone?: string;     // Driver phone (for driver tokens)
  role: 'admin' | 'driver';  // User role
  iat: number;       // Issued at timestamp (auto-generated)
  exp: number;       // Expiration timestamp (auto-generated)
}
```

## Migration from Old System

If you were using the old `JwtService` directly:

**Before:**
```typescript
const token = await this.jwt.signAsync(
  { sub: driver.id, phone: driver.phone, role: 'driver' },
  { secret: process.env.JWT_SECRET ?? 'dev-secret' }
);
```

**After:**
```typescript
const tokenResponse = await this.jwtService.generateDriverToken(driver.id, driver.phone);
const token = tokenResponse.access_token;
```

The new system is backward compatible - all existing tokens will continue to work.

