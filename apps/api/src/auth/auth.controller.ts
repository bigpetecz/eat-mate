import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('register')
  async register(
    @Body('googleId') googleId: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('displayName') displayName: string
  ) {
    return this.authService.register(googleId, email, password, displayName);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    // Clear the JWT cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res() res: Response
  ) {
    const result = await this.authService.login(email, password);
    // Set JWT as HTTP-only cookie
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ user: result.user });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // initiates the Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { access_token: string; state?: string };
    const { access_token, state } = user;
    // Set JWT as HTTP-only cookie
    res.cookie('token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // Redirect without token in URL
    const redirectUrl = `${this.configService.get(
      'FRONTEND_URL'
    )}/auth/callback?state=${encodeURIComponent(state || '/')}`;
    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@User() user: { id: string; email: string }) {
    return this.authService.findUserByEmail(user.email);
  }
}
