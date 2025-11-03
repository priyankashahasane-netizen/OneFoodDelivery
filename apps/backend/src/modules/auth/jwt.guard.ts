import { ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Demo mode: Allow requests without authentication
    // Create a demo user object for demo account (phone: 9975008124 or +919975008124)
    if (err || !user) {
      // In demo mode, create a mock user for demo account
      const demoUser = {
        sub: 'demo-driver-id',
        phone: '9975008124',
        username: '9975008124',
        role: 'driver',
        driverId: 'demo-driver-id'
      };
      
      this.logger.warn(`Authentication failed for ${context.switchToHttp().getRequest().method} ${context.switchToHttp().getRequest().url} - Using demo account`);
      
      // Return demo user instead of throwing error
      return demoUser;
    }
    return user;
  }
}



