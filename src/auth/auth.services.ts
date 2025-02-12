import * as common from "@nestjs/common";
import * as jwt from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import { WhatsAppService } from '../whatsapp/whatsapp.service'; // Pastikan WhatsAppService diimport

@common.Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: jwt.JwtService,
    private whatsappService: WhatsAppService, // Injeksi WhatsAppService
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
      throw new common.UnauthorizedException('Email sudah terdaftar');
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

    // Generate token untuk verifikasi
    const token = this.jwtService.sign({ email, phone });

    // Kirim verifikasi WhatsApp
    const message = `Hi ${email}!, your verification link is: \n\n${process.env.APP_URL}/auth/verify?token=${token}`;
    await this.whatsappService.sendVerification(user.phone, message); // Pastikan kamu punya sendVerification di WhatsAppService
    
    return { message: 'User registered successfully. Please check your WhatsApp to verify your account.' };
  }

  // Verifikasi nomor telepon
  async verifyPhone(token: string) {
    try {
      const payload = this.jwtService.verify(token); // Pastikan token valid
      const user = await this.prisma.user.findUnique({ where: { email: payload.email } });

      if (!user) throw new common.UnauthorizedException('Invalid token.');

      if (user.isVerified) {
        throw new common.UnauthorizedException('User is already verified.');
      }

      // Update status pengguna menjadi terverifikasi
      await this.prisma.user.update({
        where: { email: payload.email },
        data: { isVerified: true },
      });

      return { message: 'Phone verified successfully. You can now login.' };
    } catch (error) {
      throw new common.UnauthorizedException('Invalid or expired token.');
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
