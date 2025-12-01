import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '../../common/redis/redis.provider.js';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'blacklist:token:';

  constructor(@InjectRedis() private readonly redis: any) {}

  /**
   * Check if Redis is available
   */
  private isRedisAvailable(): boolean {
    return this.redis && (this.redis.status === 'ready' || this.redis.status === 'connecting');
  }

  /**
   * Add a token to the blacklist
   * @param token The JWT token to blacklist
   * @param expirationTime Optional expiration time in seconds (defaults to 30 days)
   */
  async addToBlacklist(token: string, expirationTime?: number): Promise<boolean> {
    try {
      if (!this.isRedisAvailable()) {
        this.logger.warn('Redis unavailable, token blacklist not available. Token will remain valid until expiration.');
        return false;
      }

      // If no expiration time provided, use 30 days (same as token expiration)
      const ttl = expirationTime || 30 * 24 * 60 * 60; // 30 days in seconds
      
      const key = `${this.BLACKLIST_PREFIX}${token}`;
      await this.redis.set(key, '1', 'EX', ttl);
      
      this.logger.debug(`Token blacklisted: ${token}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to add token to blacklist:', error);
      // Don't throw - allow request to continue even if blacklist fails
      return false;
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns true if token is blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      if (!this.isRedisAvailable()) {
        // If Redis is unavailable, assume token is not blacklisted
        // This allows the system to continue functioning without Redis
        return false;
      }

      const key = `${this.BLACKLIST_PREFIX}${token}`;
      const result = await this.redis.get(key);
      
      return result !== null;
    } catch (error) {
      this.logger.error('Failed to check token blacklist:', error);
      // On error, assume token is not blacklisted to avoid blocking legitimate requests
      return false;
    }
  }

  /**
   * Remove a token from the blacklist (useful for testing or manual cleanup)
   * @param token The JWT token to remove from blacklist
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    try {
      if (!this.isRedisAvailable()) {
        return false;
      }

      const key = `${this.BLACKLIST_PREFIX}${token}`;
      await this.redis.del(key);
      
      this.logger.debug(`Token removed from blacklist: ${token}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to remove token from blacklist:', error);
      return false;
    }
  }

  /**
   * Calculate token expiration time from JWT payload
   * Returns the time remaining until token expires in seconds
   */
  calculateTokenTTL(exp: number): number {
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now;
    // Return at least 0 (token already expired) or the remaining time
    return Math.max(0, ttl);
  }
}

