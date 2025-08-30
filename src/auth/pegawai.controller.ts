import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TripsService } from '../trips/trips.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnerRoleGuard } from './guards/owner-role.guard';
import { OwnerRole } from '../common/decorators/owner-role.decorator';

@Controller('pegawai')
@UseGuards(JwtAuthGuard, OwnerRoleGuard)
export class PegawaiController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tripsService: TripsService,
  ) {}

  @Get('users')
  @OwnerRole()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const paginationDto = { page, limit };
    return this.usersService.findAllUsers(paginationDto);
  }

  @Get('users/:id')
  @OwnerRole()
  async getUserById(@Param('id') userId: string) {
    return this.usersService.findSpecificUser(userId);
  }

  @Get('trips')
  @OwnerRole()
  async getAllTrips(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const paginationDto = { page, limit };
    return this.tripsService.findAllTrips(paginationDto);
  }

  @Get('trips/:id')
  @OwnerRole()
  async getTripById(@Param('id') tripId: string) {
    // This would need to be implemented in TripsService
    // For now, we'll return a placeholder
    return { message: 'Trip details endpoint - to be implemented' };
  }

  @Get('dashboard')
  @OwnerRole()
  async getDashboard(@Request() req) {
    // Dashboard data for pegawai
    const user = req.user;
    return {
      message: 'Dashboard data retrieved successfully',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: ['view_users', 'view_trips', 'manage_trips'],
        timestamp: new Date().toISOString(),
      }
    };
  }
} 