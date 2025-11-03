import { Body, Controller, Post } from '@nestjs/common';
import { Public } from './public.decorator.js';
import { CustomJwtService } from './jwt.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: CustomJwtService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = process.env.ADMIN_USER ?? 'admin';
    const pass = process.env.ADMIN_PASS ?? 'admin';
    if (body.username !== user || body.password !== pass) {
      return { ok: false };
    }
    const tokenResponse = await this.jwtService.generateAdminToken(user);
    return { 
      ok: true, 
      access_token: tokenResponse.access_token,
      token: tokenResponse.token,
      expiresIn: tokenResponse.expiresIn,
      expiresAt: tokenResponse.expiresAt
    };
  }
}



