import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Public } from './public.decorator.js';
import { CustomJwtService } from './jwt.service.js';
import { AdminEntity } from '../admins/entities/admin.entity.js';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwtService: CustomJwtService,
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>
  ) {}

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    // Demo admin credentials (for backward compatibility)
    const adminEmail = 'admin@stackdelivery.com';
    const adminPassword = 'Admin@123';
    const adminUser = process.env.ADMIN_USER ?? adminEmail;
    const adminPass = process.env.ADMIN_PASS ?? adminPassword;
    
    // Support both email and username
    const isEmailLogin = body.username.includes('@');
    
    // Validate credentials against hardcoded/API credentials FIRST
    const isValid = isEmailLogin 
      ? (body.username.toLowerCase() === adminEmail.toLowerCase() && body.password === adminPass)
      : (body.username === adminUser && body.password === adminPass);
    
    if (!isValid) {
      return { ok: false, message: 'Invalid credentials' };
    }
    
    // If email login, check if admin exists by email
    if (isEmailLogin) {
      const email = body.username.toLowerCase();
      let existingAdmin = await this.adminRepository.findOne({
        where: { email: email }
      });
      
      // If admin doesn't exist, create a new admin entry
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const name = email.split('@')[0];
        const username = name;
        
        const newAdmin = this.adminRepository.create({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          email: email,
          username: username,
          phone: null, // No phone for email-based login
          passwordHash: hashedPassword,
          passwordSalt: null,
          role: 'admin',
          isSuperAdmin: false,
          status: 'active',
          isVerified: true,
          lastLoginAt: new Date(),
        });
        
        existingAdmin = await this.adminRepository.save(newAdmin);
        console.log(`[auth/login] Created new admin: ${existingAdmin.email} (ID: ${existingAdmin.id})`);
      } else {
        // Admin exists - update last login time
        existingAdmin.lastLoginAt = new Date();
        await this.adminRepository.save(existingAdmin);
      }
      
      // Generate admin token with isAdmin flag using the admin ID from database
      const tokenResponse = await this.jwtService.generateAdminToken(
        body.username, 
        true, 
        existingAdmin.id
      );
      return { 
        ok: true, 
        access_token: tokenResponse.access_token,
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt,
        isAdmin: true
      };
    }
    
    // Username login (non-email) - credentials already validated above
    // Check if admin exists by username
    let existingAdmin = await this.adminRepository.findOne({
      where: { username: body.username }
    });
    
    if (!existingAdmin) {
      // Create admin for username login
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const email = `${body.username}@stackdelivery.com`;
      
      const newAdmin = this.adminRepository.create({
        name: body.username.charAt(0).toUpperCase() + body.username.slice(1),
        email: email,
        username: body.username,
        phone: null,
        passwordHash: hashedPassword,
        passwordSalt: null,
        role: 'admin',
        isSuperAdmin: false,
        status: 'active',
        isVerified: true,
        lastLoginAt: new Date(),
      });
      
      existingAdmin = await this.adminRepository.save(newAdmin);
      console.log(`[auth/login] Created new admin: ${existingAdmin.email} (ID: ${existingAdmin.id})`);
    } else {
      // Admin exists - update last login time
      existingAdmin.lastLoginAt = new Date();
      await this.adminRepository.save(existingAdmin);
    }
    
    // Generate admin token with isAdmin flag using the admin ID from database
    const tokenResponse = await this.jwtService.generateAdminToken(
      body.username, 
      true, 
      existingAdmin.id
    );
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

      // Normalize phone number for comparison (remove +91, 91 prefix, spaces)
      const normalizePhone = (phone: string) => {
        return phone.replace(/^\+91/, '').replace(/^91/, '').replace(/\s+/g, '').trim();
      };
      
      const normalizedInputPhone = normalizePhone(body.phone);
      
      // Check if admin exists in database by phone (try multiple formats)
      // Try normalized phone first
      let existingAdmin = await this.adminRepository.findOne({
        where: { phone: normalizedInputPhone }
      });
      
      // If not found, try with +91 prefix
      if (!existingAdmin) {
        existingAdmin = await this.adminRepository.findOne({
          where: { phone: `+91${normalizedInputPhone}` }
        });
      }
      
      // If not found, try with 91 prefix
      if (!existingAdmin) {
        existingAdmin = await this.adminRepository.findOne({
          where: { phone: `91${normalizedInputPhone}` }
        });
      }
      
      // If admin doesn't exist, create a new admin entry
      if (!existingAdmin) {
        // For phone login, email and password should be empty
        // Using minimal unique format for email (required field with unique constraint)
        // Format: {phone}@phone to maintain uniqueness while being minimal
        const username = `phone_${normalizedInputPhone}`;
        const email = `${normalizedInputPhone}@phone`; // Minimal unique format for phone-based login
        const name = `Admin ${normalizedInputPhone}`;
        const passwordHash = ''; // Empty password for phone-based login
        
        const newAdmin = this.adminRepository.create({
          name: name,
          email: email,
          username: username,
          phone: normalizedInputPhone,
          passwordHash: passwordHash,
          passwordSalt: null,
          role: 'admin',
          isSuperAdmin: false,
          status: 'active',
          isVerified: true,
          lastLoginAt: new Date(),
        });
        
        existingAdmin = await this.adminRepository.save(newAdmin);
        console.log(`[admin-login] Created new admin: ${existingAdmin.phone} (ID: ${existingAdmin.id})`);
      } else {
        // Update last login time and normalize phone if needed
        existingAdmin.lastLoginAt = new Date();
        // Normalize phone format if it's stored differently
        if (existingAdmin.phone !== normalizedInputPhone) {
          existingAdmin.phone = normalizedInputPhone;
        }
        await this.adminRepository.save(existingAdmin);
      }
      
      // Check admin phone whitelist (for backward compatibility)
      const adminPhones = (process.env.ADMIN_PHONES || '7775887950').split(',').map(p => normalizePhone(p.trim())).filter(Boolean);
      const isAdminPhone = adminPhones.length > 0 && adminPhones.includes(normalizedInputPhone);
      
      // Generate token with isAdmin flag using the admin ID from database
      const tokenResponse = await this.jwtService.generateAdminToken(
        body.phone,
        isAdminPhone || true, // Always true since they're in admin table
        existingAdmin.id
      );
      
      return {
        ok: true,
        access_token: tokenResponse.access_token,
        token: tokenResponse.token,
        expiresIn: tokenResponse.expiresIn,
        expiresAt: tokenResponse.expiresAt,
        isAdmin: true
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
   * Admin registration via CubeOne
   */
  @Public()
  @Post('register')
  async register(@Body() body: {
    email: string;
    mobile: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
  }) {
    try {
      // Validate required fields
      if (!body.email || !body.mobile || !body.password || !body.password_confirmation || !body.first_name || !body.last_name) {
        return { ok: false, message: 'All fields are required' };
      }

      // Validate password match
      if (body.password !== body.password_confirmation) {
        return { ok: false, message: 'Passwords do not match' };
      }

      // Format mobile for CubeOne (91<mobile>)
      let formattedMobile = body.mobile.replace(/\s+/g, '');
      if (formattedMobile.startsWith('+91')) {
        formattedMobile = formattedMobile.substring(1);
      } else if (!formattedMobile.startsWith('91')) {
        formattedMobile = `91${formattedMobile}`;
      }

      const cubeOneBaseUrl = process.env.CUBEONE_BASE_URL || 'https://apigw.cubeone.in';
      
      const cubeOneResponse = await axios.post(
        `${cubeOneBaseUrl}/v2/hybrid-auth/register`,
        {
          email: body.email,
          mobile: formattedMobile,
          password: body.password,
          password_confirmation: body.password_confirmation,
          first_name: body.first_name,
          last_name: body.last_name,
        },
        {
          headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (cubeOneResponse.data?.success === true || cubeOneResponse.status === 200 || cubeOneResponse.status === 201) {
        return {
          ok: true,
          success: true,
          message: cubeOneResponse.data?.message || 'Registration successful',
          data: cubeOneResponse.data?.data || cubeOneResponse.data,
        };
      } else {
        return {
          ok: false,
          success: false,
          message: cubeOneResponse.data?.message || 'Registration failed',
        };
      }
    } catch (error: any) {
      console.error('[auth/register] Error:', error);
      return {
        ok: false,
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        error: error.response?.data || error.message,
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



