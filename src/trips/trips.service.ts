import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ResponseHelper } from '../common/utils/response';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrip(createTripDto: CreateTripDto, ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!owner || owner.role !== 'owner') {
      throw new ForbiddenException('Only owners can create trips');
    }

    const trip = await this.prisma.trip.create({
      data: {
        ...createTripDto,
        startDate: new Date(createTripDto.startDate),
        endDate: new Date(createTripDto.endDate),
        ownerId,
        currentBookings: 0
      },
      include: {
        owner: {
          select: { email: true, role: true }
        }
      }
    });

    return ResponseHelper.created(
      trip,
      'Trip created successfully'
    );
  }

  async updateTrip(tripId: string, updateTripDto: UpdateTripDto, ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!owner || owner.role !== 'owner') {
      throw new ForbiddenException('Only owners can update trips');
    }

    const existingTrip = await this.prisma.trip.findFirst({
      where: { id: tripId, ownerId }
    });

    if (!existingTrip) {
      throw new NotFoundException('Trip not found or you do not have permission to update it');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...updateTripDto,
        ...(updateTripDto.startDate && { startDate: new Date(updateTripDto.startDate) }),
        ...(updateTripDto.endDate && { endDate: new Date(updateTripDto.endDate) })
      },
      include: {
        owner: {
          select: { email: true, role: true }
        },
        bookings: {
          include: {
            user: {
              select: { email: true, role: true }
            }
          }
        }
      }
    });

    return ResponseHelper.success(
      updatedTrip,
      'Trip updated successfully'
    );
  }

  async deleteTrip(tripId: string, ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!owner || owner.role !== 'owner') {
      throw new ForbiddenException('Only owners can delete trips');
    }

    const existingTrip = await this.prisma.trip.findFirst({
      where: { id: tripId, ownerId }
    });

    if (!existingTrip) {
      throw new NotFoundException('Trip not found or you do not have permission to delete it');
    }

    const activeBookings = await this.prisma.booking.count({
      where: { tripId, status: { in: ['pending', 'confirmed'] } }
    });

    if (activeBookings > 0) {
      throw new BadRequestException('Cannot delete trip with active bookings');
    }

    await this.prisma.trip.delete({
      where: { id: tripId }
    });

    return ResponseHelper.success(
      { message: 'Trip deleted successfully' },
      'Trip deleted successfully'
    );
  }

  async getAllTripsForOwner(ownerId: string, page: number = 1, limit: number = 10) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { role: true }
    });

    if (!owner || owner.role !== 'owner') {
      throw new ForbiddenException('Only owners can view all trips');
    }

    const skip = (page - 1) * limit;
    const total = await this.prisma.trip.count({ where: { ownerId } });

    const trips = await this.prisma.trip.findMany({
      where: { ownerId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: { email: true, role: true }
        },
        bookings: {
          include: {
            user: {
              select: { email: true, role: true }
            }
          }
        }
      }
    });

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return ResponseHelper.success(
      trips,
      'Trips retrieved successfully',
      200,
      meta
    );
  }

  async getAvailableTrips(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.trip.count({
      where: { 
        status: 'active',
        currentBookings: { lt: this.prisma.trip.fields.maxCapacity }
      }
    });

    const trips = await this.prisma.trip.findMany({
      where: { 
        status: 'active',
        currentBookings: { lt: this.prisma.trip.fields.maxCapacity }
      },
      skip,
      take: limit,
      orderBy: { startDate: 'asc' },
      include: {
        owner: {
          select: { email: true, role: true }
        }
      }
    });

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return ResponseHelper.success(
      trips,
      'Available trips retrieved successfully',
      200,
      meta
    );
  }

  async getTripById(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: {
          select: { email: true, role: true }
        },
        bookings: {
          include: {
            user: {
              select: { email: true, role: true }
            }
          }
        }
      }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return ResponseHelper.success(
      trip,
      'Trip retrieved successfully'
    );
  }

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: createBookingDto.tripId }
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.status !== 'active') {
      throw new BadRequestException('Trip is not available for booking');
    }

    if (trip.currentBookings >= trip.maxCapacity) {
      throw new BadRequestException('Trip is fully booked');
    }

    const existingBooking = await this.prisma.booking.findUnique({
      where: { tripId_userId: { tripId: createBookingDto.tripId, userId } }
    });

    if (existingBooking) {
      throw new BadRequestException('You already have a booking for this trip');
    }

    const booking = await this.prisma.booking.create({
      data: {
        tripId: createBookingDto.tripId,
        userId,
        notes: createBookingDto.notes
      },
      include: {
        trip: {
          select: { title: true, destination: true, startDate: true, endDate: true }
        },
        user: {
          select: { email: true, role: true }
        }
      }
    });

    await this.prisma.trip.update({
      where: { id: createBookingDto.tripId },
      data: { currentBookings: { increment: 1 } }
    });

    return ResponseHelper.created(
      booking,
      'Booking created successfully'
    );
  }

  async updateBooking(bookingId: string, updateBookingDto: UpdateBookingDto, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole !== 'owner' && userRole !== 'pegawai' && booking.userId !== userId) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    if (updateBookingDto.status === 'cancelled' && booking.status !== 'cancelled') {
      await this.prisma.trip.update({
        where: { id: booking.tripId },
        data: { currentBookings: { decrement: 1 } }
      });
    }

    if (updateBookingDto.status === 'confirmed' && booking.status === 'cancelled') {
      await this.prisma.trip.update({
        where: { id: booking.tripId },
        data: { currentBookings: { increment: 1 } }
      });
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateBookingDto,
      include: {
        trip: {
          select: { title: true, destination: true, startDate: true, endDate: true }
        },
        user: {
          select: { email: true, role: true }
        }
      }
    });

    return ResponseHelper.success(
      updatedBooking,
      'Booking updated successfully'
    );
  }

  async cancelBooking(bookingId: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole !== 'owner' && userRole !== 'pegawai' && booking.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
      include: {
        trip: {
          select: { title: true, destination: true, startDate: true, endDate: true }
        },
        user: {
          select: { email: true, role: true }
        }
      }
    });

    await this.prisma.trip.update({
      where: { id: booking.tripId },
      data: { currentBookings: { decrement: 1 } }
    });

    return ResponseHelper.success(
      updatedBooking,
      'Booking cancelled successfully'
    );
  }

  async getUserBookings(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.booking.count({ where: { userId } });

    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          select: { title: true, destination: true, startDate: true, endDate: true, price: true }
        }
      }
    });

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return ResponseHelper.success(
      bookings,
      'User bookings retrieved successfully',
      200,
      meta
    );
  }

  async getAllBookingsForPegawai(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.booking.count();

    const bookings = await this.prisma.booking.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          select: { title: true, destination: true, startDate: true, endDate: true, price: true }
        },
        user: {
          select: { email: true, role: true, phone: true }
        }
      }
    });

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return ResponseHelper.success(
      bookings,
      'All bookings retrieved successfully',
      200,
      meta
    );
  }
}
