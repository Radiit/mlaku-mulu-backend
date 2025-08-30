import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../common/utils/response';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'turis' as const,
    isVerified: true,
    phone: '+1234567890',
  };

  const mockUsers = [
    mockUser,
    {
      id: 'user-456',
      email: 'test2@example.com',
      role: 'pegawai' as const,
      isVerified: true,
      phone: '+1234567891',
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return paginated users successfully', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      (prismaService.user.count as jest.Mock).mockResolvedValue(2);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await service.findAllUsers(paginationDto);

      expect(result).toEqual(
        ResponseHelper.success(
          mockUsers,
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

      expect(prismaService.user.count).toHaveBeenCalled();
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      });
    });

    it('should use default pagination values when not provided', async () => {
      const paginationDto: PaginationDto = {};

      (prismaService.user.count as jest.Mock).mockResolvedValue(2);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await service.findAllUsers(paginationDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      });
    });

    it('should handle custom sorting', async () => {
      const paginationDto: PaginationDto = {
        page: 2,
        limit: 5,
        sortBy: 'email',
        sortOrder: 'asc',
      };

      (prismaService.user.count as jest.Mock).mockResolvedValue(10);
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      await service.findAllUsers(paginationDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { email: 'asc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      });
    });
  });

  describe('findSpecificUser', () => {
    it('should return user successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findSpecificUser('user-123');

      expect(result).toEqual(
        ResponseHelper.success(
          mockUser,
          'User retrieved successfully'
        )
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findSpecificUser('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        phone: '+1234567899',
        role: 'pegawai' as const,
      };

      const updatedUser = { ...mockUser, ...updateData };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-123', updateData);

      expect(result).toEqual(
        ResponseHelper.success(
          updatedUser,
          'User updated successfully'
        )
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          phone: true,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateData = { phone: '+1234567899' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateUser('nonexistent-id', updateData))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should delete user successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.removeUser('user-123');

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'User deleted successfully' },
          'User deleted successfully'
        )
      );

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.removeUser('nonexistent-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
}); 