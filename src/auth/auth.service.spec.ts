import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.services';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ResponseHelper } from '../common/utils/response';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    phone: '+1234567890',
    role: 'turis' as const,
    isVerified: false,
    verificationToken: '123456',
    tokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
    refreshToken: 'refresh-token',
    refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockEmailService = {
      sendOtpEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // phone check

      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);
      (emailService.sendOtpEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await service.register('test@example.com', 'password123', '+1234567890', 'turis');

      expect(result).toEqual(
        ResponseHelper.created(
          {
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
            isVerified: mockUser.isVerified,
            phone: mockUser.phone,
          },
          'User registered successfully. Please check your email for OTP verification.'
        )
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'turis',
          isVerified: false,
        },
      });
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('should throw BadRequestException when phone is empty', async () => {
      await expect(service.register('test@example.com', 'password123', '', 'turis'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when email already exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register('test@example.com', 'password123', '+1234567890', 'turis'))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when phone already exists', async () => {
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockUser); // phone check

      await expect(service.register('test@example.com', 'password123', '+1234567890', 'turis'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.verifyOtp('test@example.com', '123456');

      expect(result).toEqual(
        ResponseHelper.success(
          { userId: mockUser.id, email: mockUser.email },
          'Email verified successfully. You can now login.'
        )
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          isVerified: true,
          verificationToken: null,
          tokenExpiry: null,
        },
      });
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyOtp('test@example.com', 'invalid'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException for already verified user', async () => {
      const verifiedUser = { ...mockUser, isVerified: true };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(verifiedUser);

      await expect(service.verifyOtp('test@example.com', '123456'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resendOtp', () => {
    it('should resend OTP successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);
      (emailService.sendOtpEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await service.resendOtp('test@example.com');

      expect(result).toEqual(
        ResponseHelper.created(
          { message: 'New OTP sent successfully. Please check your email.' },
          'OTP resent successfully'
        )
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          verificationToken: expect.any(String),
          tokenExpiry: expect.any(Date),
        },
      });
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('should throw BadRequestException for non-existent email', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.resendOtp('nonexistent@example.com'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already verified user', async () => {
      const verifiedUser = { ...mockUser, isVerified: true };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(verifiedUser);

      await expect(service.resendOtp('test@example.com'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      const verifiedUser = { ...mockUser, isVerified: true };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(verifiedUser);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      (prismaService.user.update as jest.Mock).mockResolvedValue(verifiedUser);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toEqual(
        ResponseHelper.success(
          {
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            expires_in: 900,
          },
          'Login successful'
        )
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unverified user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.login('test@example.com', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      const verifiedUser = { ...mockUser, isVerified: true };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(verifiedUser);

      await expect(service.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken('valid-refresh-token');

      expect(result).toEqual(
        ResponseHelper.success(
          {
            access_token: 'new-access-token',
            expires_in: 900,
          },
          'Access token refreshed successfully'
        )
      );

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { secret: expect.any(String), expiresIn: '15m' }
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshAccessToken('invalid-refresh-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.logout('user-123');

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'Logged out successfully' },
          'Logout successful'
        )
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          refreshToken: null,
          refreshTokenExpiry: null,
        },
      });
    });
  });
}); 