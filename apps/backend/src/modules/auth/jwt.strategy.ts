import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { Request } from 'express';
import axios from 'axios';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly tokenBlacklistService: TokenBlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
      passReqToCallback: true, // Pass request to verify callback
    } as StrategyOptions);
  }

  private async decryptToken(token: string) {
    const url = process.env.CUBEONE_DECRYPT_URL || 'https://apigw.cubeone.in/api/v1/dev/decrypt';
    try {
      const resp = await axios.post(
        url,
        { token },
        { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
      );
      return resp.data?.data ?? resp.data;
    } catch (err) {
      this.logger.warn(`Decrypt token failed: ${err?.message ?? err}`);
      return null;
    }
  }

  async validate(req: Request, payload: any) {
    // Extract the token from the authorization header
    const authHeader = req.headers.authorization;
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    const decrypted = token ? await this.decryptToken(token) : null;
    const decryptedUserId = decrypted?.userId || decrypted?.user_id || decrypted?.id || decrypted?.sub;
    const role = decrypted?.role || payload.role;
    const adminId = decrypted?.adminId || payload.adminId || decryptedUserId || payload.sub;
    
    // Check if token is blacklisted
    if (token) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        this.logger.warn(`Blacklisted token attempted to be used: ${token}`);
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Handle both admin tokens (username) and driver tokens (phone)
    return { 
      sub: decryptedUserId || payload.sub, 
      username: decrypted?.username || decrypted?.phone || payload.username || payload.phone, 
      phone: decrypted?.phone || payload.phone,
      role: role,
      isAdmin: decrypted?.isAdmin ?? payload.isAdmin ?? role === 'admin',
      driverId: role === 'driver' ? (decrypted?.driverId || decryptedUserId || payload.sub) : undefined,
      adminId: role === 'admin' ? adminId : undefined
    };
  }
}



