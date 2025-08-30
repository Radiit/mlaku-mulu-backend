import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ResponseHelper } from '../common/utils/response';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('OwnerService', () => {
  let service: OwnerService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOwner = {
    id: 'owner-123',
    email: 'owner@example.com',
    password: 'hashedPassword',
    phone: '+1234567890',
    role: 'owner' as const,
    isVerified: false, // Now false because needs OTP verification
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    password: 'hashedPassword',
    phone: '+1234567891',
    role: 'turis' as const,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockEmailService = {
      sendOtpEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<OwnerService>(OwnerService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registerOwner', () => {
    it('should register owner successfully', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      const registerOwnerDto = {
        email: 'owner@example.com',
        password: 'Password123',
        phone: '+1234567890',
        name: 'John Owner',
      };

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // phone check

      (prismaService.user.create as jest.Mock).mockResolvedValue(mockOwner);

      const result = await service.registerOwner(registerOwnerDto);

      expect(result).toEqual(
        ResponseHelper.created(
          {
            id: mockOwner.id,
            email: mockOwner.email,
            role: mockOwner.role,
            isVerified: false, // Now false because needs OTP verification
            phone: mockOwner.phone,
            name: 'John Owner',
            message: 'Owner registered successfully. Please check your email for OTP verification.',
          },
          'Owner registered successfully. Please verify your email with OTP.'
        )
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'owner@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'owner',
          isVerified: false,
          verificationToken: expect.any(String),
          tokenExpiry: expect.any(Date),
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerOwnerDto = {
        email: 'existing@example.com',
        password: 'Password123',
        phone: '+1234567890',
        name: 'John Owner',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.registerOwner(registerOwnerDto))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when phone already exists', async () => {
      const registerOwnerDto = {
        email: 'owner@example.com',
        password: 'Password123',
        phone: '+1234567891',
        name: 'John Owner',
      };

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(mockUser); // phone check

      await expect(service.registerOwner(registerOwnerDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('assignRole', () => {
    it('should assign role successfully when current user is owner', async () => {
      const assignRoleDto = {
        userId: 'user-123',
        role: 'pegawai' as const,
      };

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ role: 'owner' }) // current user
        .mockResolvedValueOnce({ id: 'user-123', role: 'turis' }); // target user

      const updatedUser = { ...mockUser, role: 'pegawai' };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.assignRole(assignRoleDto, 'owner-123');

      expect(result).toEqual(
        ResponseHelper.success(
          updatedUser,
          'User role updated to pegawai successfully'
        )
      );
    });

    it('should throw ForbiddenException when current user is not owner', async () => {
      const assignRoleDto = {
        userId: 'user-123',
        role: 'pegawai' as const,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ role: 'pegawai' });

      await expect(service.assignRole(assignRoleDto, 'pegawai-123'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when trying to change owner role', async () => {
      const assignRoleDto = {
        userId: 'owner-456',
        role: 'pegawai' as const,
      };

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ role: 'owner' }) // current user
        .mockResolvedValueOnce({ id: 'owner-456', role: 'owner' }); // target user

      await expect(service.assignRole(assignRoleDto, 'owner-123'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users when current user is owner', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
      (prismaService.user.count as jest.Mock).mockResolvedValue(2);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockOwner, mockUser]);

      const result = await service.getAllUsers('owner-123', 1, 10);

      expect(result).toEqual(
        ResponseHelper.success(
          [mockOwner, mockUser],
          'Users retrieved successfully',
          200,
          {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          }
        )
      );
    });

    it('should throw ForbiddenException when current user is not owner', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ role: 'pegawai' });

      await expect(service.getAllUsers('pegawai-123', 1, 10))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyOwnerOtp', () => {
    it('should verify owner OTP successfully', async () => {
      const verifyOtpDto = {
        email: 'owner@example.com',
        otp: 'ABC123',
      };

      const mockOwnerWithToken = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: false,
        verificationToken: 'ABC123',
        tokenExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      };

      const verifiedOwner = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: true,
        phone: '+1234567890',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithToken);
      (prismaService.user.update as jest.Mock).mockResolvedValue(verifiedOwner);

      const result = await service.verifyOwnerOtp(verifyOtpDto);

      expect(result).toEqual(
        ResponseHelper.success(
          verifiedOwner,
          'Owner verified successfully. You can now login.'
        )
      );
    });

    it('should throw BadRequestException when OTP is invalid', async () => {
      const verifyOtpDto = {
        email: 'owner@example.com',
        otp: 'WRONG123',
      };

      const mockOwnerWithToken = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: false,
        verificationToken: 'ABC123',
        tokenExpiry: new Date(Date.now() + 5 * 60 * 1000),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithToken);

      await expect(service.verifyOwnerOtp(verifyOtpDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when OTP is expired', async () => {
      const verifyOtpDto = {
        email: 'owner@example.com',
        otp: 'ABC123',
      };

      const mockOwnerWithExpiredToken = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: false,
        verificationToken: 'ABC123',
        tokenExpiry: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithExpiredToken);

      await expect(service.verifyOwnerOtp(verifyOtpDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('resendOwnerOtp', () => {
    it('should resend OTP successfully', async () => {
      const resendOtpDto = {
        email: 'owner@example.com',
      };

      const mockOwner = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: false,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockOwner);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockOwner);

      const result = await service.resendOwnerOtp(resendOtpDto);

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'New OTP sent to your email' },
          'New OTP sent successfully'
        )
      );
    });

    it('should throw BadRequestException when owner is already verified', async () => {
      const resendOtpDto = {
        email: 'owner@example.com',
      };

      const mockVerifiedOwner = {
        id: 'owner-123',
        email: 'owner@example.com',
        role: 'owner',
        isVerified: true,
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockVerifiedOwner);

      await expect(service.resendOwnerOtp(resendOtpDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully when current user is owner', async () => {
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ role: 'owner' }) // current user
        .mockResolvedValueOnce({ id: 'user-123', role: 'turis' }); // target user

      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.deleteUser('user-123', 'owner-123');

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'User deleted successfully' },
          'User deleted successfully'
        )
      );
    });

    it('should throw ForbiddenException when trying to delete owner', async () => {
      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ role: 'owner' }) // current user
        .mockResolvedValueOnce({ id: 'owner-456', role: 'owner' }); // target user

      await expect(service.deleteUser('owner-456', 'owner-123'))
        .rejects.toThrow(ForbiddenException);
    });
  });
}); 