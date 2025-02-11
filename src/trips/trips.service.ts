import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async createTrip(userId: string, createTripDto: CreateTripDto) {
    const user = await this.prisma.user.findUnique({ where: { id: createTripDto.turisId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${createTripDto.turisId} not found.`);
    }
    if (user.role !== 'turis') {
      throw new BadRequestException(`User with ID ${createTripDto.turisId} is not a turis.`);
    }

    // Check for conflicting trip
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

    // kirim email ke turis
    const subject = 'Your trip has been successfully created';
    const text = `Hello ${user.email}, your trip to ${trip.destination} has been successfully created.\n\nStart Date: ${trip.startDate}\nEnd Date: ${trip.endDate}`;
    const html = `<p>Hello ${user.email},</p><p>Your trip to <b>${trip.destination}</b> has been successfully created.</p><p>Start Date: ${trip.startDate}</p><p>End Date: ${trip.endDate}</p>`;
    await this.emailService.sendEmail(user.email, subject, text, html);

    return trip;
  }

  async updateTrip(tripId: string, updateTripDto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, include: { turis: true } });

    if (!trip) throw new NotFoundException('Trip not found');

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: updateTripDto,
    });

    // kirim email ke turis
    const subject = 'Your trip has been updated';
    const text = `Hello ${trip.turis.email}, your trip to ${updatedTrip.destination} has been updated.\n\nStart Date: ${updatedTrip.startDate}\nEnd Date: ${updatedTrip.endDate}`;
    const html = `<p>Hello ${trip.turis.email},</p><p>Your trip to <b>${updatedTrip.destination}</b> has been updated.</p><p>Start Date: ${updatedTrip.startDate}</p><p>End Date: ${updatedTrip.endDate}</p>`;
    await this.emailService.sendEmail(trip.turis.email, subject, text, html);

    return updatedTrip;
  }
}
