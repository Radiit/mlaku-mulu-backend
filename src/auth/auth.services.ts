import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { access } from "fs";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async register(email: string, password: string, role: 'pegawai' | 'turis') {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: { email, password: hashedPassword, role },
        });

        return { message: 'User Registered Successfully' };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload);

        return { access_token: token };

    }
}