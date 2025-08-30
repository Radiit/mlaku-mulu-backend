import { PaginationHelper } from './pagination';
import { PaginationDto } from '../dto/pagination.dto';

describe('PaginationHelper', () => {
  describe('calculatePaginationMeta', () => {
    it('should calculate pagination metadata correctly', () => {
      const paginationDto: PaginationDto = {
        page: 2,
        limit: 10,
      };
      const total = 25;

      const result = PaginationHelper.calculatePaginationMeta(paginationDto, total);

      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
        nextPage: 3,
        prevPage: 1,
      });
    });

    it('should handle first page correctly', () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const total = 25;

      const result = PaginationHelper.calculatePaginationMeta(paginationDto, total);

      expect(result.hasPrevPage).toBe(false);
      expect(result.prevPage).toBe(null);
      expect(result.hasNextPage).toBe(true);
      expect(result.nextPage).toBe(2);
    });

    it('should handle last page correctly', () => {
      const paginationDto: PaginationDto = { page: 3, limit: 10 };
      const total = 25;

      const result = PaginationHelper.calculatePaginationMeta(paginationDto, total);

      expect(result.hasPrevPage).toBe(true);
      expect(result.prevPage).toBe(2);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextPage).toBe(null);
    });

    it('should use default values when pagination not provided', () => {
      const paginationDto: PaginationDto = {};
      const total = 5;

      const result = PaginationHelper.calculatePaginationMeta(paginationDto, total);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null,
      });
    });

    it('should handle single page results', () => {
      const paginationDto: PaginationDto = { page: 1, limit: 20 };
      const total = 15;

      const result = PaginationHelper.calculatePaginationMeta(paginationDto, total);

      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });
  });

  describe('getSkipAndTake', () => {
    it('should calculate skip and take correctly', () => {
      const paginationDto: PaginationDto = { page: 3, limit: 15 };
      const result = PaginationHelper.getSkipAndTake(paginationDto);

      expect(result).toEqual({
        skip: 30, // (3-1) * 15
        take: 15,
      });
    });

    it('should use default values when not provided', () => {
      const paginationDto: PaginationDto = {};
      const result = PaginationHelper.getSkipAndTake(paginationDto);

      expect(result).toEqual({
        skip: 0, // (1-1) * 10
        take: 10,
      });
    });

    it('should handle edge cases', () => {
      const paginationDto: PaginationDto = { page: 1, limit: 1 };
      const result = PaginationHelper.getSkipAndTake(paginationDto);

      expect(result).toEqual({
        skip: 0,
        take: 1,
      });
    });
  });

  describe('getOrderBy', () => {
    it('should return default order when sortBy not provided', () => {
      const paginationDto: PaginationDto = {};
      const result = PaginationHelper.getOrderBy(paginationDto);

      expect(result).toEqual({ id: 'desc' });
    });

    it('should return default order with custom sortOrder', () => {
      const paginationDto: PaginationDto = { sortOrder: 'asc' };
      const result = PaginationHelper.getOrderBy(paginationDto);

      expect(result).toEqual({ id: 'asc' });
    });

    it('should handle createdAt sorting', () => {
      const paginationDto: PaginationDto = { sortBy: 'createdAt', sortOrder: 'asc' };
      const result = PaginationHelper.getOrderBy(paginationDto);

      expect(result).toEqual({ createdAt: 'asc' });
    });

    it('should handle custom field sorting', () => {
      const paginationDto: PaginationDto = { sortBy: 'email', sortOrder: 'desc' };
      const result = PaginationHelper.getOrderBy(paginationDto);

      expect(result).toEqual({ email: 'desc' });
    });

    it('should use desc as default sortOrder', () => {
      const paginationDto: PaginationDto = { sortBy: 'name' };
      const result = PaginationHelper.getOrderBy(paginationDto);

      expect(result).toEqual({ name: 'desc' });
    });
  });
}); 