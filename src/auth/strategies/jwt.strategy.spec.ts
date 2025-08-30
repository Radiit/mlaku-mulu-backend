import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jwtService = module.get(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate JWT payload and return user data', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'turis',
        iat: 1644567890,
        exp: 1644571490,
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'turis',
      });
    });

    it('should handle different user roles', async () => {
      const mockPayload = {
        sub: 'user-456',
        email: 'pegawai@example.com',
        role: 'pegawai',
        iat: 1644567890,
        exp: 1644571490,
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        id: 'user-456',
        email: 'pegawai@example.com',
        role: 'pegawai',
      });
    });
  });
}); 