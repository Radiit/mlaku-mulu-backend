import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../common/utils/response';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { CreateTripTurisDto } from '../auth/dto/create-trip-turis.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('TripsService', () => {
  let service: TripsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-123',
    email: 'turis@example.com',
    role: 'turis' as const,
    phone: '+1234567890',
  };

  const mockTrip = {
    id: 'trip-123',
    turisId: 'user-123',
    startDate: new Date('2025-02-10T10:00:00Z'),
    endDate: new Date('2025-02-15T10:00:00Z'),
    destination: 'Bali, Indonesia',
    turis: mockUser,
  };

  const mockTrips = [mockTrip];

  beforeEach(async () => {
    const mockPrismaService = {
      trip: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAllTrips', () => {
    it('should return paginated trips successfully', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      (prismaService.trip.count as jest.Mock).mockResolvedValue(1);
      (prismaService.trip.findMany as jest.Mock).mockResolvedValue(mockTrips);

      const result = await service.findAllTrips(paginationDto);

      expect(result).toEqual(
        ResponseHelper.success(
          mockTrips,
          'Trips retrieved successfully',
          200,
          {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          }
        )
      );

      expect(prismaService.trip.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          turis: {
            select: {
              id: true,
              email: true,
              role: true,
              phone: true,
            },
          },
        },
      });
    });
  });

  describe('findTripByUser', () => {
    it('should return user trips successfully', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      (prismaService.trip.count as jest.Mock).mockResolvedValue(1);
      (prismaService.trip.findMany as jest.Mock).mockResolvedValue(mockTrips);

      const result = await service.findTripByUser('user-123', paginationDto);

      expect(result).toEqual(
        ResponseHelper.success(
          mockTrips,
          'Your trips retrieved successfully',
          200,
          {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            nextPage: null,
            prevPage: null,
          }
        )
      );

      expect(prismaService.trip.count).toHaveBeenCalledWith({
        where: { turisId: 'user-123' },
      });
    });

    it('should handle pagination when not provided', async () => {
      (prismaService.trip.count as jest.Mock).mockResolvedValue(1);
      (prismaService.trip.findMany as jest.Mock).mockResolvedValue(mockTrips);

      await service.findTripByUser('user-123');

      expect(prismaService.trip.findMany).toHaveBeenCalledWith({
        where: { turisId: 'user-123' },
        skip: 0,
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          turis: {
            select: {
              id: true,
              email: true,
              role: true,
              phone: true,
            },
          },
        },
      });
    });
  });

  describe('createTrip', () => {
    it('should create trip successfully for valid turis', async () => {
      const createTripDto: CreateTripDto = {
        turisId: 'user-123',
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.trip.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.trip.create as jest.Mock).mockResolvedValue(mockTrip);

      const result = await service.createTrip('pegawai-123', createTripDto);

      expect(result).toEqual(
        ResponseHelper.created(
          mockTrip,
          'Trip created successfully'
        )
      );

      expect(prismaService.trip.create).toHaveBeenCalledWith({
        data: {
          turisId: 'user-123',
          startDate: new Date('2025-02-10T10:00:00Z'),
          endDate: new Date('2025-02-15T10:00:00Z'),
          destination: 'Bali, Indonesia',
        },
        include: {
          turis: {
            select: {
              id: true,
              email: true,
              role: true,
              phone: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when turis not found', async () => {
      const createTripDto: CreateTripDto = {
        turisId: 'nonexistent-user',
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createTrip('pegawai-123', createTripDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not turis', async () => {
      const createTripDto: CreateTripDto = {
        turisId: 'user-123',
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      const pegawaiUser = { ...mockUser, role: 'pegawai' as const };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(pegawaiUser);

      await expect(service.createTrip('pegawai-123', createTripDto))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when startDate is after endDate', async () => {
      const createTripDto: CreateTripDto = {
        turisId: 'user-123',
        startDate: '2025-02-15T10:00:00Z',
        endDate: '2025-02-10T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.createTrip('pegawai-123', createTripDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for conflicting trips', async () => {
      const createTripDto: CreateTripDto = {
        turisId: 'user-123',
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.trip.findFirst as jest.Mock).mockResolvedValue(mockTrip);

      await expect(service.createTrip('pegawai-123', createTripDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createTripTuris', () => {
    it('should create trip successfully for turis', async () => {
      const createTripDto: CreateTripTurisDto = {
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.trip.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.trip.create as jest.Mock).mockResolvedValue(mockTrip);

      const result = await service.createTripTuris('user-123', createTripDto);

      expect(result).toEqual(
        ResponseHelper.created(
          mockTrip,
          'Trip created successfully by turis'
        )
      );
    });

    it('should throw ForbiddenException when user is not turis', async () => {
      const createTripDto: CreateTripTurisDto = {
        startDate: '2025-02-10T10:00:00Z',
        endDate: '2025-02-15T10:00:00Z',
        destination: 'Bali, Indonesia',
      };

      const pegawaiUser = { ...mockUser, role: 'pegawai' as const };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(pegawaiUser);

      await expect(service.createTripTuris('user-123', createTripDto))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateTripPegawai', () => {
    it('should update trip successfully', async () => {
      const updateTripDto: UpdateTripDto = {
        startDate: '2025-02-12T10:00:00Z',
        destination: 'Jakarta, Indonesia',
      };

      const updatedTrip = { ...mockTrip, ...updateTripDto };

      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prismaService.trip.update as jest.Mock).mockResolvedValue(updatedTrip);

      const result = await service.updateTripPegawai('trip-123', updateTripDto);

      expect(result).toEqual(
        ResponseHelper.success(
          updatedTrip,
          'Trip updated successfully by pegawai'
        )
      );
    });

    it('should throw NotFoundException when trip not found', async () => {
      const updateTripDto: UpdateTripDto = {
        destination: 'Jakarta, Indonesia',
      };

      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateTripPegawai('nonexistent-trip', updateTripDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTripTuris', () => {
    it('should update own trip successfully', async () => {
      const updateTripDto: UpdateTripDto = {
        destination: 'Jakarta, Indonesia',
      };

      const updatedTrip = { ...mockTrip, ...updateTripDto };

      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prismaService.trip.update as jest.Mock).mockResolvedValue(updatedTrip);

      const result = await service.updateTripTuris('trip-123', updateTripDto, 'user-123');

      expect(result).toEqual(
        ResponseHelper.success(
          updatedTrip,
          'Trip updated successfully by turis'
        )
      );
    });

    it('should throw ForbiddenException when updating other user trip', async () => {
      const updateTripDto: UpdateTripDto = {
        destination: 'Jakarta, Indonesia',
      };

      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

      await expect(service.updateTripTuris('trip-123', updateTripDto, 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeTripPegawai', () => {
    it('should delete trip successfully', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prismaService.trip.delete as jest.Mock).mockResolvedValue(mockTrip);

      const result = await service.removeTripPegawai('trip-123');

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'Trip deleted successfully' },
          'Trip deleted successfully by pegawai'
        )
      );
    });
  });

  describe('removeTripTuris', () => {
    it('should delete own trip successfully', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
      (prismaService.trip.delete as jest.Mock).mockResolvedValue(mockTrip);

      const result = await service.removeTripTuris('trip-123', 'user-123');

      expect(result).toEqual(
        ResponseHelper.success(
          { message: 'Trip deleted successfully' },
          'Trip deleted successfully by turis'
        )
      );
    });

    it('should throw ForbiddenException when deleting other user trip', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

      await expect(service.removeTripTuris('trip-123', 'other-user'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('date validation', () => {
    it('should accept valid ISO UTC dates', () => {
      const validDate = '2025-02-10T10:00:00Z';
      const result = (service as any).parseUtcIso(validDate, 'startDate');
      expect(result).toEqual(new Date(validDate));
    });

    it('should reject non-UTC dates', () => {
      const invalidDate = '2025-02-10T10:00:00+07:00';
      expect(() => (service as any).parseUtcIso(invalidDate, 'startDate'))
        .toThrow(BadRequestException);
    });

    it('should reject invalid date strings', () => {
      const invalidDate = 'invalid-date';
      expect(() => (service as any).parseUtcIso(invalidDate, 'startDate'))
        .toThrow(BadRequestException);
    });
  });
}); 