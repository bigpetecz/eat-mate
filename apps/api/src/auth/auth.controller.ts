import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body('googleId') googleId: string,
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('displayName') displayName: string
  ) {
    return this.authService.register(googleId, email, password, displayName);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.authService.login(email, password);
  }
}
