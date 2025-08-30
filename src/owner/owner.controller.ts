import { Controller, Get, UseGuards } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseHelper } from '../common/utils/response';

@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('dashboard')
  async getDashboardStats() {
    const stats = await this.ownerService.getDashboardStats();
    return ResponseHelper.success(
      stats,
      'Dashboard statistics retrieved successfully'
    );
  }

  @Get('analytics/users')
  async getUserAnalytics() {
    return await this.ownerService.getUserAnalytics();
  }

  @Get('analytics/trips')
  async getTripAnalytics() {
    return await this.ownerService.getTripAnalytics();
  }

  @Get('health')
  async getSystemHealth() {
    return await this.ownerService.getSystemHealth();
  }
} 