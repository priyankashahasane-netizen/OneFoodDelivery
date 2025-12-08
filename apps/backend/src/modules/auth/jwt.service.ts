import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  username?: string;
  phone?: string;
  role: 'admin' | 'driver';
  isAdmin?: boolean; // Flag to indicate if user has admin privileges
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  access_token: string;
  token: string;
  expiresIn: number;
  expiresAt: Date;
}

@Injectable()
export class CustomJwtService {
  private readonly jwtSecret: string;
  private readonly tokenExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') ?? 'dev-secret';
    this.tokenExpiration = this.configService.get<string>('JWT_EXPIRATION') ?? '30d';
  }

  /**
   * Generate a new JWT token for a user
   */
  async generateToken(payload: TokenPayload): Promise<TokenResponse> {
    // Remove iat and exp from payload as they will be added by JWT service
    const { iat, exp, ...cleanPayload } = payload;

    const token = await this.jwtService.signAsync(cleanPayload, {
      secret: this.jwtSecret,
      expiresIn: this.tokenExpiration,
    });

    // Calculate expiration time
    const expiresInSeconds = this.parseExpiration(this.tokenExpiration);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    return {
      access_token: token,
      token: token,
      expiresIn: expiresInSeconds,
      expiresAt,
    };
  }

  /**
   * Generate token for admin user
   */
  async generateAdminToken(username: string, isAdmin: boolean = true): Promise<TokenResponse> {
    return this.generateToken({
      sub: 'admin',
      username,
      role: 'admin',
      isAdmin,
    });
  }

  /**
   * Generate token for driver
   */
  async generateDriverToken(driverId: string, phone: string): Promise<TokenResponse> {
    return this.generateToken({
      sub: driverId,
      phone,
      role: 'driver',
    });
  }

  /**
   * Verify and decode a JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.jwtSecret,
      });
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse expiration string to seconds
   * Supports: 30d, 7d, 24h, 3600s, etc.
   */
  private parseExpiration(expiration: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = expiration.match(regex);

    if (!match) {
      return 2592000; // Default: 30 days in seconds
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 2592000; // Default: 30 days
    }
  }

  /**
   * Get the JWT secret (for configuration checks)
   */
  getSecret(): string {
    return this.jwtSecret;
  }

  /**
   * Check if using default secret (security warning)
   */
  isUsingDefaultSecret(): boolean {
    return this.jwtSecret === 'dev-secret';
  }
}

