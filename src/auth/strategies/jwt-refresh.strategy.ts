import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          console.log('JwtRefreshStrategy extractor called');
          const token = request?.body?.refreshToken || request?.query?.refreshToken;
          console.log('Extracted token:', token ? 'found' : 'not found');
          return token;
        }
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
      passReqToCallback: true,
    });
    console.log('JwtRefreshStrategy initialized with name: jwt-refresh');
    console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'set' : 'not set');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
    console.log('Using secret:', process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret');
  }

  async validate(req: Request, payload: any) {
    console.log('JwtRefreshStrategy.validate called with payload:', payload);
    console.log('Request body:', req.body);
    
    const refreshToken = req.body.refreshToken || req.query.refreshToken;
    
    if (!refreshToken) {
      console.log('No refresh token found in request');
      throw new UnauthorizedException('Refresh token is required');
    }

    console.log('Refresh token found:', refreshToken);

    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        refreshToken: refreshToken,
        refreshTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      console.log('User not found or token expired');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    console.log('User found:', user.id);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
} 