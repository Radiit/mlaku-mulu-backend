import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { create } from 'domain';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAllTrips() {
    const trips = await this.prisma.trip.findMany();
    if (!trips.length) {
        return { Success: true, message: "No trips found", data: [] };
    }
    return trips;
  }

  async findTripByUser(userId: string) {
    return this.prisma.trip.findMany({
      where: { turisId: userId },
    });
  }

  async createTrip(userId: string, createTripDto: CreateTripDto) {

    const user = await this.prisma.user.findUnique({ where: { id: createTripDto.turisId } });

    if (!user) {
        throw new NotFoundException(`User with ID ${createTripDto.turisId} not found.`);
    }
    if (user.role !== 'turis') {
        throw new ForbiddenException(`User with ID ${createTripDto.turisId} is not a turis.`);
    }

    // makesure trip not conflict
    const conflictingTrip = await this.prisma.trip.findFirst({
        where: {
            turisId: createTripDto.turisId,
            OR: [
                {
                    startDate: { lte: createTripDto.endDate },
                    endDate: { gte: createTripDto.startDate },
                },
            ],
        },
    });

    if (conflictingTrip) {
        throw new BadRequestException(`Trip conflicts with an existing trip (ID: ${conflictingTrip.id}) from ${conflictingTrip.startDate} to ${conflictingTrip.endDate}.`);
    }

    return this.prisma.trip.create({
      data: {
        turisId: userId,
        startDate: createTripDto.startDate,
        endDate: createTripDto.endDate,
        destination: createTripDto.destination,
      },
    });
  }

  async updateTrip(tripId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    return this.prisma.trip.update({
      where: { id: tripId },
      data: updateTripDto,
    });
  }

  async removeTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    return this.prisma.trip.delete({ where: { id: tripId } });
  }
}
