import { Controller, Get, Query, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.services';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.phone,
      'turis' // Default role for general register
    );
  }

  @Post('register/pegawai')
  async registerPegawai(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.phone,
      'pegawai'
    );
  }

  @Post('register/turis')
  async registerTuris(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.phone,
      'turis'
    );
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.email);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto, @Req() req: any) {
    return this.authService.refreshAccessToken(req.user.id, refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(@Body() logoutDto: LogoutDto, @Req() req: any) {
    return this.authService.logout(req.user.id);
  }
}

