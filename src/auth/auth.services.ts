import * as common from "@nestjs/common";
import * as jwt from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@common.Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: jwt.JwtService,
    private emailService: EmailService,
  ) {}

  // Fungsi registrasi pengguna
  async register(email: string, password: string, phone: string, role: 'pegawai' | 'turis') {
    // Pastikan nomor telepon tidak null
    if (!phone || phone === '') {
      throw new common.BadRequestException('Phone number is required and cannot be empty.');
    }

    // Periksa apakah email atau nomor telepon sudah terdaftar
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
        phone,  // Pastikan phone tidak null
        role,
        isVerified: false, // Semua user harus verifikasi
      },
    });

    // Generate OTP untuk verifikasi
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Simpan OTP ke database (bisa di temporary table atau user table)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken: otp,
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000) // 10 menit expiry
      }
    });

    // Kirim verifikasi email
    await this.emailService.sendOtpEmail(email, otp);
    
    return { message: 'User registered successfully. Please check your email for OTP verification.' };
  }

  // Verifikasi nomor telepon
  async verifyPhone(token: string) {
    try {
      const user = await this.prisma.user.findFirst({ 
        where: { 
          verificationToken: token,
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

      return { message: 'Phone verified successfully. You can now login.' };
    } catch (error) {
      throw new common.UnauthorizedException('Invalid or expired OTP.');
    }
  }

  // Fungsi login
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new common.UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new common.UnauthorizedException('Please verify your phone before logging in.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new common.UnauthorizedException('Invalid credentials');

    // Buat JWT token untuk session
    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
