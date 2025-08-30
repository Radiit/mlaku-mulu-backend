import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTripDto } from '../auth/dto/create-trip.dto';
import { CreateTripTurisDto } from '../auth/dto/create-trip-turis.dto';
import { UpdateTripDto } from '../auth/dto/update-trip.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseHelper } from '../common/utils/response';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Roles('pegawai')
  async findAllTrips(@Query() paginationDto: PaginationDto) {
      return await this.tripsService.findAllTrips(paginationDto);
  }
  

  @Get('me')
  async findMyTrips(@Request() req, @Query() paginationDto: PaginationDto) {
    return await this.tripsService.findTripByUser(req.user.userId, paginationDto);
  }

  @Post('pegawai')
  @Roles('pegawai')
  async createTripPegawai(@Body() createTripDto: CreateTripDto) {
    const trip = await this.tripsService.createTrip(createTripDto.turisId, createTripDto);
    return ResponseHelper.created(
      trip,
      'Trip created successfully by pegawai'
    );
  }

  @Post('turis')
  async createTripTuris(@Body() createTripDto: CreateTripTurisDto, @Request() req) {
    const trip = await this.tripsService.createTripTuris(req.user.id, createTripDto);
    return ResponseHelper.created(
      trip,
      'Trip created successfully by turis'
    );
  }

  @Patch('pegawai/:id')
  @Roles('pegawai')
  async updateTripPegawai(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto) {
    const trip = await this.tripsService.updateTripPegawai(id, updateTripDto);
    return ResponseHelper.success(
      trip,
      'Trip updated successfully by pegawai'
    );
  }

  @Patch('turis/:id')
  async updateTripTuris(@Param('id') id: string, @Body() updateTripDto: UpdateTripDto, @Request() req) {
    const trip = await this.tripsService.updateTripTuris(id, updateTripDto, req.user.id);
    return ResponseHelper.success(
      trip,
      'Trip updated successfully by turis'
    );
  }

  @Delete('pegawai/:id')
  @Roles('pegawai')
  async removeTripPegawai(@Param('id') id: string) {
    const result = await this.tripsService.removeTripPegawai(id);
    return ResponseHelper.success(
      result,
      'Trip deleted successfully by pegawai'
    );
  }

  @Delete('turis/:id')
  async removeTripTuris(@Param('id') id: string, @Request() req) {
    const result = await this.tripsService.removeTripTuris(id, req.user.id);
    return ResponseHelper.success(
      result,
      'Trip deleted successfully by turis'
    );
  }
}
