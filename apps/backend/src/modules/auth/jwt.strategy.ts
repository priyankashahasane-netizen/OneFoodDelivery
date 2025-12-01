import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { Request } from 'express';

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

  async validate(req: Request, payload: any) {
    // Extract the token from the authorization header
    const authHeader = req.headers.authorization;
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
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
      sub: payload.sub, 
      username: payload.username || payload.phone, 
      phone: payload.phone,
      role: payload.role,
      driverId: payload.sub // For backward compatibility
    };
  }
}



