import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  @Public()
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = process.env.ADMIN_USER ?? 'admin';
    const pass = process.env.ADMIN_PASS ?? 'admin';
    if (body.username !== user || body.password !== pass) {
      return { ok: false };
    }
    const token = await this.jwt.signAsync({ sub: 'admin', username: user, role: 'admin' }, { secret: process.env.JWT_SECRET ?? 'dev-secret' });
    return { ok: true, access_token: token };
  }
}



