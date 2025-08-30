import { PaginationDto } from '../dto/pagination.dto';
import { PaginationMeta } from '../types/base-response';

export class PaginationHelper {
  static calculatePaginationMeta(
    paginationDto: PaginationDto,
    total: number
  ): PaginationMeta {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  static getSkipAndTake(paginationDto: PaginationDto) {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    return { skip, take: limit };
  }

  static getOrderBy(paginationDto: PaginationDto) {
    if (!paginationDto.sortBy) {
      return { id: paginationDto.sortOrder || 'desc' };
    }

    if (paginationDto.sortBy === 'createdAt') {
      return { createdAt: paginationDto.sortOrder || 'desc' };
    }

    return {
      [paginationDto.sortBy]: paginationDto.sortOrder || 'desc',
    };
  }
} 