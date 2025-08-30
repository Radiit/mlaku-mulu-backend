import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as common from '@nestjs/common';
import { ResponseHelper } from '../common/utils/response';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async registerOwner(email: string, password: string, phone: string, role: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role,
          isVerified: false, 
        },
      });

      // Generate a more robust 6-character alphanumeric OTP
      const otp = this.generateOtp();
      
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
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new common.ConflictException('Email already registered');
        }
        if (error.meta?.target?.includes('phone')) {
          throw new common.ConflictException('Phone number already registered');
        }
        throw new common.ConflictException('User with this information already exists');
      }
      throw error;
    }
  }

  async register(email: string, password: string, phone: string, role: 'pegawai' | 'turis') {
    if (!phone || phone === '') {
      throw new common.BadRequestException('Phone number is required and cannot be empty.');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new common.ConflictException('Email already registered');
    }

    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new common.ConflictException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,  
          role,
          isVerified: false, 
        },
      });

      // Generate a more robust 6-character alphanumeric OTP
      const otp = this.generateOtp();
      
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
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new common.ConflictException('Email already registered');
        }
        if (error.meta?.target?.includes('phone')) {
          throw new common.ConflictException('Phone number already registered');
        }
        throw new common.ConflictException('User with this information already exists');
      }
      throw error;
    }
  }

  // Helper method to generate consistent OTP format
  private generateOtp(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async verifyOtp(email: string, otp: string) {
    try {
      // Normalize OTP input (remove spaces, convert to uppercase)
      const normalizedOtp = otp.replace(/\s/g, '').toUpperCase();
      
      const user = await this.prisma.user.findFirst({ 
        where: { 
          email: email,
          verificationToken: normalizedOtp,
          tokenExpiry: { gt: new Date() }
        } 
      });

      if (!user) {
        // Log for debugging
        console.log(`OTP verification failed for ${email}: OTP ${normalizedOtp} not found or expired`);
        throw new common.UnauthorizedException('Invalid or expired OTP.');
      }

      if (user.isVerified) {
        throw new common.BadRequestException('User is already verified.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          isVerified: true,
          verificationToken: null,
          tokenExpiry: null
        },
      });

      return ResponseHelper.success(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} verified successfully. You can now login.`
        },
        'Email verified successfully. You can now login.'
      );
    } catch (error) {
      if (error instanceof common.HttpException) {
        throw error;
      }
      throw new common.UnauthorizedException('Invalid or expired OTP.');
    }
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new common.BadRequestException('Email not found. Please register first.');
    }

    if (user.isVerified) {
      throw new common.BadRequestException('User is already verified.');
    }

    // Generate new OTP using the same format
    const otp = this.generateOtp();
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken: otp,
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await this.emailService.sendOtpEmail(email, otp);
    
    return ResponseHelper.created(
      { message: 'New OTP sent successfully. Please check your email.' },
      'OTP resent successfully'
    );
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new common.UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isVerified) {
      throw new common.UnauthorizedException('Please verify your email before logging in.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new common.UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { 
      secret: process.env.JWT_SECRET || 'secret',
      expiresIn: '15m'
    });
    
    const refreshToken = this.jwtService.sign(payload, { 
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: '7d'
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return ResponseHelper.success(
      { 
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900
      },
      'Login successful'
    );
  }

  async refreshAccessToken(refreshToken: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: refreshToken,
        refreshTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new common.UnauthorizedException('Invalid or expired refresh token');
    }

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
} 