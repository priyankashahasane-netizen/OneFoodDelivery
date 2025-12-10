import { Body, Controller, Post } from '@nestjs/common';
import { Public } from './public.decorator.js';
import { CustomJwtService } from './jwt.service.js';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: CustomJwtService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    // Demo admin credentials
    const adminEmail = 'admin@stackdelivery.com';
    const adminPassword = 'Admin@123';
    const adminUser = process.env.ADMIN_USER ?? adminEmail;
    const adminPass = process.env.ADMIN_PASS ?? adminPassword;
    const adminId = process.env.ADMIN_ID ?? 'demo-admin-id';
    
    // Support both email and username
    const isEmail = body.username.includes('@');
    const isValid = isEmail 
      ? (body.username.toLowerCase() === adminEmail.toLowerCase() && body.password === adminPass)
      : (body.username === adminUser && body.password === adminPass);
    
    if (!isValid) {
      return { ok: false, message: 'Invalid credentials' };
    }
    
    // Generate admin token with isAdmin flag
    const tokenResponse = await this.jwtService.generateAdminToken(body.username, true, adminId);
    return { 
      ok: true, 
      access_token: tokenResponse.access_token,
      token: tokenResponse.token,
      expiresIn: tokenResponse.expiresIn,
      expiresAt: tokenResponse.expiresAt,
      isAdmin: true
    };
  }

  /**
   * Request OTP from CubeOne (proxied through backend)
   */
  @Public()
  @Post('otp/request')
  async requestOtp(@Body() body: { phone: string }) {
    try {
      if (!body.phone) {
        return { ok: false, message: 'Phone number is required' };
      }

      // Format phone for CubeOne (91<mobile>)
      const formattedPhone = body.phone.startsWith('+91') 
        ? body.phone.substring(1) 
        : body.phone.startsWith('91') 
        ? body.phone 
        : `91${body.phone}`;

      const cubeOneBaseUrl = process.env.CUBEONE_BASE_URL || 'https://apigw.cubeone.in';
      
      const cubeOneResponse = await axios.post(
        `${cubeOneBaseUrl}/v2/hybrid-auth/request-otp`,
        { username: formattedPhone },
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (cubeOneResponse.data?.success === true) {
        return {
          ok: true,
          message: cubeOneResponse.data.message || 'OTP sent successfully',
        };
      } else {
        return {
          ok: false,
          message: cubeOneResponse.data?.message || 'Failed to send OTP',
        };
      }
    } catch (error: any) {
      console.error('[auth/otp/request] Error:', error);
      return {
        ok: false,
        message: error.response?.data?.message || 'Failed to request OTP',
      };
    }
  }

  /**
   * Admin login with OTP via CubeOne
   */
  @Public()
  @Post('admin-login')
  async adminLogin(@Body() body: { 
    phone: string; 
    otp: string; 
    access_token?: string;
  }) {
    try {
      if (!body.phone || !body.otp) {
        return { ok: false, message: 'Phone number and OTP are required' };
      }

      let cubeOneAccessToken: string | null = null;

      // If access_token is provided, use it directly
      if (body.access_token) {
        cubeOneAccessToken = body.access_token;
        console.log(`[admin-login] Using provided access_token`);
      } else {
        // Otherwise, call CubeOne login API to get access_token
        console.log(`[admin-login] Calling CubeOne login API for phone: ${body.phone}`);
        
        try {
          // Format phone for CubeOne (91<mobile>)
          const formattedPhone = body.phone.startsWith('+91') 
            ? body.phone.substring(1) 
            : body.phone.startsWith('91') 
            ? body.phone 
            : `91${body.phone}`;

          const cubeOneBaseUrl = process.env.CUBEONE_BASE_URL || 'https://apigw.cubeone.in';
          const cubeOneLoginUri = process.env.CUBEONE_LOGIN_URI || '/v2/hybrid-auth/login';
          
          const cubeOneResponse = await axios.post(
            `${cubeOneBaseUrl}${cubeOneLoginUri}`,
            {
              username: formattedPhone,
              login_otp: body.otp,
            },
            {
              headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );

          if (cubeOneResponse.data?.success === true && cubeOneResponse.data?.data) {
            const data = cubeOneResponse.data.data;
            cubeOneAccessToken = data.tokens?.access_token || 
                                data.token || 
                                data.access_token || 
                                data.accessToken || 
                                data.auth_token || 
                                data.authToken;
            console.log(`[admin-login] Received access_token from CubeOne`);
          } else {
            return { ok: false, message: cubeOneResponse.data?.message || 'CubeOne login failed' };
          }
        } catch (cubeOneError: any) {
          console.error(`[admin-login] CubeOne login error:`, cubeOneError);
          return { 
            ok: false, 
            message: cubeOneError.response?.data?.message || 'Failed to login with CubeOne' 
          };
        }
      }

      if (!cubeOneAccessToken) {
        return { ok: false, message: 'Failed to obtain access_token from CubeOne' };
      }

      // Check admin phone whitelist
      // Normalize phone number for comparison (remove +91, 91 prefix, spaces)
      const normalizePhone = (phone: string) => {
        return phone.replace(/^\+91/, '').replace(/^91/, '').replace(/\s+/g, '').trim();
      };
      
      const adminPhones = (process.env.ADMIN_PHONES || '7775887950').split(',').map(p => normalizePhone(p.trim())).filter(Boolean);
      const normalizedInputPhone = normalizePhone(body.phone);
      const isAdminPhone = adminPhones.length > 0 && adminPhones.includes(normalizedInputPhone);
      
      // If not admin phone, still allow login but mark as non-admin
      // Generate token with isAdmin flag based on phone whitelist
      const tokenResponse = await this.jwtService.generateAdminToken(
        body.phone,
        isAdminPhone,
        process.env.ADMIN_ID
      );
      
      return {
        ok: true,
        access_token: tokenResponse.access_token,
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt,
        isAdmin: isAdminPhone
      };
    } catch (error: any) {
      console.error('[admin-login] Error:', error);
      return { 
        ok: false, 
        message: 'Failed to login', 
        error: error.message 
      };
    }
  }

  /**
   * Decode JWT payload without verification (for external tokens)
   */
  private decodeJwtPayload(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64').toString().split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }
}



