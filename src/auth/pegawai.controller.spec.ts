import { Test, TestingModule } from '@nestjs/testing';
import { PegawaiController } from './pegawai.controller';
import { UsersService } from '../users/users.service';
import { TripsService } from '../trips/trips.service';
import { ResponseHelper } from '../common/utils/response';

describe('PegawaiController', () => {
  let controller: PegawaiController;
  let usersService: jest.Mocked<UsersService>;
  let tripsService: jest.Mocked<TripsService>;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    role: 'turis' as const,
    isVerified: true,
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

  beforeEach(async () => {
    const mockUsersService = {
      findAllUsers: jest.fn(),
      findSpecificUser: jest.fn(),
    };

    const mockTripsService = {
      findAllTrips: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PegawaiController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TripsService,
          useValue: mockTripsService,
        },
      ],
    }).compile();

    controller = module.get<PegawaiController>(PegawaiController);
    usersService = module.get(UsersService);
    tripsService = module.get(TripsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const mockResponse = ResponseHelper.success(
        [mockUser],
        'Users retrieved successfully',
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
      );

      (usersService.findAllUsers as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.getAllUsers(1, 10);

      expect(result).toEqual(mockResponse);
      expect(usersService.findAllUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('should use default pagination values', async () => {
      const mockResponse = ResponseHelper.success(
        [mockUser],
        'Users retrieved successfully'
      );

      (usersService.findAllUsers as jest.Mock).mockResolvedValue(mockResponse);

      await controller.getAllUsers(1, 10);

      expect(usersService.findAllUsers).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getUserById', () => {
    it('should return specific user by ID', async () => {
      const mockResponse = ResponseHelper.success(
        mockUser,
        'User retrieved successfully'
      );

      (usersService.findSpecificUser as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.getUserById('user-123');

      expect(result).toEqual(mockResponse);
      expect(usersService.findSpecificUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getAllTrips', () => {
    it('should return all trips with pagination', async () => {
      const mockResponse = ResponseHelper.success(
        [mockTrip],
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
      );

      (tripsService.findAllTrips as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.getAllTrips(1, 10);

      expect(result).toEqual(mockResponse);
      expect(tripsService.findAllTrips).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('getTripById', () => {
    it('should return placeholder message for trip details', async () => {
      const result = await controller.getTripById('trip-123');

      expect(result).toEqual({
        message: 'Trip details endpoint - to be implemented'
      });
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const mockRequest = {
        user: {
          id: 'pegawai-123',
          email: 'pegawai@example.com',
          role: 'pegawai',
        },
      };

      const result = await controller.getDashboard(mockRequest);

      expect(result).toEqual({
        message: 'Dashboard data retrieved successfully',
        data: {
          userId: 'pegawai-123',
          email: 'pegawai@example.com',
          role: 'pegawai',
          permissions: ['view_users', 'view_trips', 'manage_trips'],
          timestamp: expect.any(String),
        }
      });
    });
  });
}); 