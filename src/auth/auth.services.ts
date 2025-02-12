import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { WhatsAppService } from "src/whatsapp/whatsapp.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private whatsappService: WhatsAppService
  ) {}

  async register(email: string, password: string, phone: string, role: 'pegawai' | 'turis') {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,  // Tidak boleh null
        role,
        isVerified: false, // Semua user harus verifikasi
      },
    });

    // Generate token buat verifikasi
    const token = this.jwtService.sign({ email, phone });

    // Kirim WhatsApp verif
    await this.whatsappService.sendVerification(phone, token);

    return { message: 'User registered successfully. Please check your WhatsApp to verify your account.' };
}

  async verifyPhone(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({ where: { email: payload.email } });

      if (!user) throw new UnauthorizedException('Invalid token.');

      await this.prisma.user.update({
        where: { email: payload.email },
        data: { isVerified: true },
      });

      return { message: 'Phone verified successfully. You can now login.' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isVerified) throw new UnauthorizedException('Please verify your phone before logging in.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
