import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService, private whatsappService: WhatsAppService) {}

  async findAllTrips() {
    const trips = await this.prisma.trip.findMany();
    if (!trips.length) {
      return { success: true, message: "No trips found", data: [] };
    }
    return { success: true, message: "Trips retrieved successfully", data: trips };
  }

  async findTripByUser(userId: string) {
    return this.prisma.trip.findMany({ where: { turisId: userId } });
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

    // Cek apakah ada trip yang bertabrakan
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
    });

    const message = `Hi ${user.email}!, trip successfully created for you!\n\nDestination: ${this.destinationToText(trip.destination)}\nDate: ${trip.startDate.toISOString()} - ${trip.endDate.toISOString()}`;
    await this.whatsappService.sendNotification(user.phone, message);

    return trip;
  }

  async updateTrip(tripId: string, updateTripDto: UpdateTripDto) {
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
    });

    const message = `Hi ${trip.turis.email}!, trip successfully updated!\n\nDestination: ${this.destinationToText(updatedTrip.destination)}\nDate: ${updatedTrip.startDate.toISOString()} - ${updatedTrip.endDate.toISOString()}`;
    await this.whatsappService.sendNotification(trip.turis.phone, message);

    return updatedTrip;
  }

  async removeTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    await this.prisma.trip.delete({ where: { id: tripId } });

    const message = `Hi ${trip.turis.email}!, your trip to ${this.destinationToText(trip.destination)} has been canceled.`;
    await this.whatsappService.sendNotification(trip.turis.phone, message);

    return { message: 'Trip deleted successfully' };
  }

  private parseUtcIso(value: string, field: string): Date {
    // Enforce UTC by requiring a trailing 'Z' or an explicit +00:00 offset
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
