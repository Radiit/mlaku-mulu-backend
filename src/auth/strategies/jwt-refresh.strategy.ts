import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken || req.query.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Verify refresh token exists in database and not expired
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        refreshToken: refreshToken,
        refreshTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
} 