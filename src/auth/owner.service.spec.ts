import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { PrismaService } from '../prisma/prisma.service';
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
    isVerified: true,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
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
            isVerified: mockOwner.isVerified,
            phone: mockOwner.phone,
            name: 'John Owner',
          },
          'Owner registered successfully'
        )
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'owner@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'owner',
          isVerified: true,
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