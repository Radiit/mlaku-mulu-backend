import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { CreateTripTurisDto } from '../auth/dto/create-trip-turis.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationHelper } from '../common/utils/pagination';
import { ResponseHelper } from '../common/utils/response';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAllTrips(paginationDto: PaginationDto) {
    const { skip, take } = PaginationHelper.getSkipAndTake(paginationDto);
    const orderBy = PaginationHelper.getOrderBy(paginationDto);

    const total = await this.prisma.trip.count();

    // Get paginated data
    const trips = await this.prisma.trip.findMany({
      skip,
      take,
      orderBy,
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });

    const meta = PaginationHelper.calculatePaginationMeta(paginationDto, total);

    return ResponseHelper.success(
      trips,
      'Trips retrieved successfully',
      200,
      meta
    );
  }

  async findTripByUser(userId: string, paginationDto?: PaginationDto) {
    const { skip, take } = PaginationHelper.getSkipAndTake(paginationDto || {});
    const orderBy = PaginationHelper.getOrderBy(paginationDto || {});

    const total = await this.prisma.trip.count({
      where: { turisId: userId }
    });

    // Get paginated trips for this user
    const trips = await this.prisma.trip.findMany({ 
      where: { turisId: userId },
      skip,
      take,
      orderBy,
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });
    
    const meta = PaginationHelper.calculatePaginationMeta(paginationDto || {}, total);
    
    return ResponseHelper.success(
      trips,
      'Your trips retrieved successfully',
      200,
      meta
    );
  }

  async createTrip(userId: string, createTripDto: CreateTripDto) {
    const user = await this.prisma.user.findUnique({ where: { id: createTripDto.turisId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${createTripDto.turisId} not found.`);
    }
    if (user.role !== 'turis') {
      throw new ForbiddenException(`User with ID ${createTripDto.turisId} is not a turis.`);
    }

    const startDate = this.parseUtcIso(createTripDto.startDate, 'startDate');
    const endDate = this.parseUtcIso(createTripDto.endDate, 'endDate');
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const conflictingTrip = await this.prisma.trip.findFirst({
      where: {
        turisId: createTripDto.turisId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (conflictingTrip) {
      throw new BadRequestException(`Trip conflicts with an existing trip (ID: ${conflictingTrip.id})`);
    }

    const destination = this.resolveDestination(createTripDto);

    const trip = await this.prisma.trip.create({
      data: {
        turisId: createTripDto.turisId,
        startDate,
        endDate,
        destination,
      },
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });

    return ResponseHelper.created(
      trip,
      'Trip created successfully'
    );
  }

  async createTripTuris(userId: string, createTripDto: CreateTripTurisDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'turis') {
      throw new ForbiddenException('Only turis can create trips for themselves');
    }

    const startDate = this.parseUtcIso(createTripDto.startDate, 'startDate');
    const endDate = this.parseUtcIso(createTripDto.endDate, 'endDate');
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const conflictingTrip = await this.prisma.trip.findFirst({
      where: {
        turisId: userId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (conflictingTrip) {
      throw new BadRequestException(`Trip conflicts with an existing trip (ID: ${conflictingTrip.id})`);
    }

    const destination = this.resolveDestination(createTripDto);

    const trip = await this.prisma.trip.create({
      data: {
        turisId: userId,
        startDate,
        endDate,
        destination,
      },
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });

    return ResponseHelper.created(
      trip,
      'Trip created successfully by turis'
    );
  }

  async updateTripPegawai(tripId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const data: any = {};
    if (typeof updateTripDto.startDate === 'string') {
      data.startDate = this.parseUtcIso(updateTripDto.startDate, 'startDate');
    }
    if (typeof updateTripDto.endDate === 'string') {
      data.endDate = this.parseUtcIso(updateTripDto.endDate, 'endDate');
    }
    if (updateTripDto.destination !== undefined || updateTripDto.destinationObj !== undefined) {
      data.destination = this.resolveDestination(updateTripDto as any);
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });

    return ResponseHelper.success(
      updatedTrip,
      'Trip updated successfully by pegawai'
    );
  }

  async updateTripTuris(tripId: string, updateTripDto: UpdateTripDto, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.turisId !== userId) {
      throw new ForbiddenException('You can only update your own trips');
    }

    const data: any = {};
    if (typeof updateTripDto.startDate === 'string') {
      data.startDate = this.parseUtcIso(updateTripDto.startDate, 'startDate');
    }
    if (typeof updateTripDto.endDate === 'string') {
      data.endDate = this.parseUtcIso(updateTripDto.endDate, 'endDate');
    }
    if (updateTripDto.destination !== undefined || updateTripDto.destinationObj !== undefined) {
      data.destination = this.resolveDestination(updateTripDto as any);
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true,
            phone: true
          }
        }
      }
    });

    return ResponseHelper.success(
      updatedTrip,
      'Trip updated successfully by turis'
    );
  }

  async removeTripPegawai(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    await this.prisma.trip.delete({ where: { id: tripId } });

    return ResponseHelper.success(
      { message: 'Trip deleted successfully' },
      'Trip deleted successfully by pegawai'
    );
  }

  async removeTripTuris(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.turisId !== userId) {
      throw new ForbiddenException('You can only delete your own trips');
    }

    await this.prisma.trip.delete({ where: { id: tripId } });

    return ResponseHelper.success(
      { message: 'Trip deleted successfully' },
      'Trip deleted successfully by turis'
    );
  }



  private parseUtcIso(value: string, field: string): Date {
    const isoPattern = /Z|[+-]00:00$/;
    if (!isoPattern.test(value)) {
      throw new BadRequestException(`${field} must be an ISO 8601 UTC string (e.g., 2025-02-10T12:00:00Z)`);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO 8601 date string`);
    }
    return d;
  }

  private resolveDestination(dto: { destination?: any; destinationObj?: any }): any {
    if (dto.destinationObj !== undefined) return dto.destinationObj;
    if (dto.destination !== undefined) return dto.destination;
    throw new BadRequestException('destination or destinationObj is required');
  }

  private destinationToText(dest: any): string {
    if (typeof dest === 'string') return dest;
    try {
      return JSON.stringify(dest);
    } catch {
      return String(dest);
    }
  }
}
