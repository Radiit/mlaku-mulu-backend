import * as common from "@nestjs/common";
import * as jwt from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { ResponseHelper } from '../common/utils/response';

@common.Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: jwt.JwtService,
    private emailService: EmailService,
  ) {}


  async register(email: string, password: string, phone: string, role: 'pegawai' | 'turis') {

    if (!phone || phone === '') {
      throw new common.BadRequestException('Phone number is required and cannot be empty.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new common.UnauthorizedException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat pengguna baru
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,  
        role,
        isVerified: false, 
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken: otp,
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 menit expiry
      }
    });

    await this.emailService.sendOtpEmail(email, otp);
    
    return ResponseHelper.created(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        phone: user.phone
      },
      'User registered successfully. Please check your email for OTP verification.'
    );
  }

  async verifyOtp(email: string, otp: string) {
    try {
      const user = await this.prisma.user.findFirst({ 
        where: { 
          email: email,
          verificationToken: otp,
          tokenExpiry: { gt: new Date() }
        } 
      });

      if (!user) throw new common.UnauthorizedException('Invalid or expired OTP.');

      if (user.isVerified) {
        throw new common.UnauthorizedException('User is already verified.');
      }

      // Update status pengguna menjadi terverifikasi
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          isVerified: true,
          verificationToken: null,
          tokenExpiry: null
        },
      });

      return ResponseHelper.success(
        { userId: user.id, email: user.email },
        'Email verified successfully. You can now login.'
      );
    } catch (error) {
      throw new common.UnauthorizedException('Invalid or expired OTP.');
    }
  }

  // Fungsi login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new common.UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new common.UnauthorizedException('Please verify your email before logging in.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new common.UnauthorizedException('Invalid credentials');

    // Generate access token dan refresh token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { 
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m' // Access token expires in 15 minutes
    });
    
    const refreshToken = this.jwtService.sign(payload, { 
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d' // Refresh token expires in 7 days
    });

    // Save refresh token to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    return ResponseHelper.success(
      { 
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900 // 15 minutes in seconds
      },
      'Login successful'
    );
  }

  // Generate new access token using refresh token
  async refreshAccessToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        refreshToken: refreshToken,
        refreshTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new common.UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new access token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = this.jwtService.sign(payload, { 
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m'
    });

    return ResponseHelper.success(
      { 
        access_token: newAccessToken,
        expires_in: 900
      },
      'Access token refreshed successfully'
    );
  }

  // Logout - invalidate refresh token
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null
      }
    });

    return ResponseHelper.success(
      { message: 'Logged out successfully' },
      'Logout successful'
    );
  }

  // Resend OTP
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new common.BadRequestException('Email not found. Please register first.');
    }

    if (user.isVerified) {
      throw new common.BadRequestException('User is already verified.');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update OTP in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken: otp,
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 menit expiry
      }
    });

    // Send new OTP email
    await this.emailService.sendOtpEmail(email, otp);
    
    return ResponseHelper.created(
      { message: 'New OTP sent successfully. Please check your email.' },
      'OTP resent successfully'
    );
  }
}
