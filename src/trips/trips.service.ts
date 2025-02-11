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

    // Cek apakah ada trip yang bertabrakan
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
      throw new BadRequestException(`Trip conflicts with an existing trip (ID: ${conflictingTrip.id})`);
    }

    const trip = await this.prisma.trip.create({
      data: {
        turisId: createTripDto.turisId,
        startDate: createTripDto.startDate,
        endDate: createTripDto.endDate,
        destination: createTripDto.destination,
      },
    });

    // Kirim notifikasi ke WhatsApp turis
    const message = `Hi ${user.email}!, trip successfully created for you!\n\nDestination: ${trip.destination}\nDate: ${trip.startDate} - ${trip.endDate}`;
    await this.whatsappService.sendNotification(user.phone, message);

    return trip;
  }

  async updateTrip(tripId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { turis: true },
    });

    if (!trip) throw new NotFoundException('Trip not found');

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: updateTripDto,
    });

    // Kirim notifikasi ke WhatsApp turis
    const message = `Hi ${trip.turis.email}!, trip successfully updated!\n\nDestination: ${updatedTrip.destination}\nDate: ${updatedTrip.startDate} - ${updatedTrip.endDate}`;
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

    // Kirim notifikasi ke WhatsApp turis
    const message = `Hi ${trip.turis.email}!, your trip to ${trip.destination} has been canceled.`;
    await this.whatsappService.sendNotification(trip.turis.phone, message);

    return { message: 'Trip deleted successfully' };
  }
}
