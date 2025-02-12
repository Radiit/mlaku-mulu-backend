import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Roles('pegawai')
  async findAllTrips() {
      const trips = await this.tripsService.findAllTrips();
      return {
        success: true,
        message: "Trip retrieved successfully",
        data:trips 
      };
  }
  

  @Get('me')
  async findMyTrips(@Request() req) {
    return {
      success: true,
      message: "Your trips retrieved successfully",
      data: await this.tripsService.findTripByUser(req.user.userId),
    };
  }

  @Post()
  @Roles('pegawai')
  async createTrip(@Body() createTripDto: CreateTripDto) {
    return {
      success: true,
      message: "Trip created successfully",
      data: await this.tripsService.createTrip(createTripDto.turisId, createTripDto),
    };
  }

  @Patch(':id')
  @Roles('pegawai')
  async updateTrip(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    return {
      success: true,
      message: "Trip updated successfully",
      data: await this.tripsService.updateTrip(id, updateTripDto),
    };
  }

  @Delete(':id')
  @Roles('pegawai')
  async removeTrip(@Param('id') id: string) {
    return {
      success: true,
      message: "Trip deleted successfully",
      data: await this.tripsService.removeTrip(id),
    };
  }
}
