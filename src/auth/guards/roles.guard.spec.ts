import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'turis',
        },
      })),
    })),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      (reflector.get as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      (reflector.get as jest.Mock).mockReturnValue(['turis', 'pegawai']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      (reflector.get as jest.Mock).mockReturnValue(['pegawai']);

      expect(() => guard.canActivate(mockExecutionContext))
        .toThrow(ForbiddenException);
    });

    it('should deny access when user object is missing', () => {
      (reflector.get as jest.Mock).mockReturnValue(['turis']);

      const contextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({})),
        })),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(contextWithoutUser))
        .toThrow(ForbiddenException);
    });

    it('should deny access when user role is missing', () => {
      (reflector.get as jest.Mock).mockReturnValue(['turis']);

      const contextWithoutRole = {
        ...mockExecutionContext,
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          })),
        })),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(contextWithoutRole))
        .toThrow(ForbiddenException);
    });
  });
}); 