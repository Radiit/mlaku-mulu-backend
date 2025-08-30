import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerRoleGuard } from '../auth/guards/owner-role.guard';
import { OwnerRole } from '../common/decorators/owner-role.decorator';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}
  
  @Get()
  async getAvailableTrips(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return this.tripsService.getAvailableTrips(page, limit);
  }

  @Get(':id')
  async getTripById(@Param('id') id: string) {
    return this.tripsService.getTripById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async createTrip(@Body() createTripDto: CreateTripDto, @Request() req) {
    return this.tripsService.createTrip(createTripDto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async updateTrip(
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @Request() req
  ) {
    return this.tripsService.updateTrip(id, updateTripDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async deleteTrip(@Param('id') id: string, @Request() req) {
    return this.tripsService.deleteTrip(id, req.user.id);
  }

  @Get('owner/all')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async getAllTripsForOwner(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req
  ) {
    return this.tripsService.getAllTripsForOwner(req.user.id, page, limit);
  }

  @Post('book')
  @UseGuards(JwtAuthGuard)
  async createBooking(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.tripsService.createBooking(createBookingDto, req.user.id);
  }

  @Patch('bookings/:id')
  @UseGuards(JwtAuthGuard)
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Request() req
  ) {
    return this.tripsService.updateBooking(id, updateBookingDto, req.user.id, req.user.role);
  }

  @Delete('bookings/:id')
  @UseGuards(JwtAuthGuard)
  async cancelBooking(@Param('id') id: string, @Request() req) {
    return this.tripsService.cancelBooking(id, req.user.id, req.user.role);
  }

  @Get('bookings/me')
  @UseGuards(JwtAuthGuard)
  async getUserBookings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req
  ) {
    return this.tripsService.getUserBookings(req.user.id, page, limit);
  }

  @Get('bookings/all')
  @UseGuards(JwtAuthGuard)
  async getAllBookingsForPegawai(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req
  ) {
    if (req.user.role !== 'pegawai' && req.user.role !== 'owner') {
      throw new Error('Only pegawai and owner can view all bookings');
    }
    return this.tripsService.getAllBookingsForPegawai(page, limit);
  }
}
