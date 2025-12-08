# Authentication System Deployment Guide

## Architecture Overview

The authentication system is designed for separate deployments:
- **Backend**: NestJS API server (deployed separately)
- **Admin Dashboard**: Next.js frontend (deployed separately)
- **Mobile App**: Flutter app (deployed separately)

## Authentication Flow

### Password Login
1. Admin enters username/password in dashboard
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage

### OTP Login
1. Admin enters phone number in dashboard
2. Frontend calls `POST /api/auth/otp/request`
3. Backend proxies request to CubeOne API
4. Admin receives OTP via SMS
5. Admin enters OTP
6. Frontend calls `POST /api/auth/admin-login`
7. Backend validates with CubeOne and checks admin whitelist
8. Backend generates JWT token
9. Frontend stores token in localStorage

## Deployment Configuration

### Backend Deployment

#### Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# CORS - IMPORTANT: Set exact origins for production
CORS_ORIGINS=https://admin.yourdomain.com,https://app.yourdomain.com

# Admin Authentication
ADMIN_USER=your_admin_username
ADMIN_PASS=your_secure_password
ADMIN_PHONES=919876543210,919876543211  # Comma-separated admin phone numbers

# JWT
JWT_SECRET=your-very-secure-random-secret-key
JWT_EXPIRATION=30d

# CubeOne API
CUBEONE_BASE_URL=https://apigw.cubeone.in
CUBEONE_LOGIN_URI=/v2/hybrid-auth/login
```

#### CORS Configuration

**Development:**
```env
CORS_ORIGINS=*
```

**Production:**
```env
CORS_ORIGINS=https://admin.yourdomain.com,https://app.yourdomain.com
```

#### Security Checklist
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `CORS_ORIGINS` to exact production URLs (no wildcards)
- [ ] Set strong `ADMIN_USER` and `ADMIN_PASS`
- [ ] Configure `ADMIN_PHONES` whitelist for OTP login
- [ ] Use HTTPS in production
- [ ] Enable rate limiting for auth endpoints

### Admin Dashboard Deployment

#### Environment Variables

```bash
# Backend API URL - MUST match backend CORS_ORIGINS
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com

# OSM Tiles (optional)
NEXT_PUBLIC_OSM_TILES=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

#### Build Configuration

The dashboard should be built with the correct API base URL:

```bash
# Build with production API URL
NEXT_PUBLIC_API_BASE=https://api.yourdomain.com npm run build
```

#### Deployment Checklist
- [ ] Set `NEXT_PUBLIC_API_BASE` to production backend URL
- [ ] Ensure backend CORS allows your dashboard domain
- [ ] Test login flows (password and OTP)
- [ ] Verify token storage in localStorage
- [ ] Test API calls with authentication

### Mobile App Deployment

The mobile app already uses CubeOne directly. Ensure:
- [ ] Backend CORS includes mobile app domain (if using web version)
- [ ] API base URL is configured correctly
- [ ] Token storage works across app restarts

## API Endpoints

### Authentication Endpoints

#### Password Login
```
POST /api/auth/login
Body: { username: string, password: string }
Response: { ok: boolean, access_token: string, token: string, expiresIn: number, expiresAt: Date }
```

#### Request OTP
```
POST /api/auth/otp/request
Body: { phone: string }
Response: { ok: boolean, message: string }
```

#### Admin OTP Login
```
POST /api/auth/admin-login
Body: { phone: string, otp: string, access_token?: string }
Response: { ok: boolean, access_token: string, token: string, expiresIn: number, expiresAt: Date }
```

### Authenticated Requests

All authenticated requests require:
```
Authorization: Bearer <token>
```

## Security Considerations

1. **Token Storage**: Frontend stores tokens in localStorage (consider httpOnly cookies for enhanced security)
2. **CORS**: Backend validates exact origins in production
3. **Admin Whitelist**: OTP login requires phone number in `ADMIN_PHONES` whitelist
4. **JWT Expiration**: Tokens expire after 30 days (configurable)
5. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGINS` in backend matches frontend domain exactly
- Check for trailing slashes or protocol mismatches
- Ensure credentials are enabled in CORS config

### Authentication Failures
- Verify `JWT_SECRET` matches between environments
- Check token expiration
- Verify admin phone is in `ADMIN_PHONES` whitelist

### API Connection Issues
- Verify `NEXT_PUBLIC_API_BASE` points to correct backend URL
- Check backend is accessible from frontend domain
- Verify network/firewall rules allow connections

## Testing Checklist

### Development
- [ ] Password login works
- [ ] OTP request works
- [ ] OTP login works
- [ ] Token is stored correctly
- [ ] Authenticated API calls work
- [ ] Logout clears token

### Production
- [ ] All development tests pass
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled
- [ ] Admin whitelist is configured
- [ ] JWT secret is secure
- [ ] Error messages don't leak sensitive info
