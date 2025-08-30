import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { OwnerRoleGuard } from './owner-role.guard';
import { Reflector } from '@nestjs/core';

describe('OwnerRoleGuard', () => {
  let guard: OwnerRoleGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'owner',
        },
      })),
    })),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerRoleGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<OwnerRoleGuard>(OwnerRoleGuard);
    reflector = module.get(Reflector);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no role is required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has owner role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('owner');

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has pegawai role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('owner');

      const contextWithPegawai = {
        ...mockExecutionContext,
        switchToHttp: jest.fn(() => ({
          getRequest: jest.fn(() => ({
            user: {
              id: 'user-123',
              email: 'test@example.com',
              role: 'pegawai',
            },
          })),
        })),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(contextWithPegawai);

      expect(result).toBe(true);
    });

    it('should deny access when user has turis role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('owner');

      const contextWithTuris = {
        ...mockExecutionContext,
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

      expect(() => guard.canActivate(contextWithTuris))
        .toThrow(ForbiddenException);
    });

    it('should deny access when user object is missing', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('owner');

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
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('owner');

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