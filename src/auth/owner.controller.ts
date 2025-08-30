import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param,
  Delete,
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { ResendOwnerOtpDto } from './dto/resend-owner-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OwnerRoleGuard } from './guards/owner-role.guard';
import { OwnerRole } from '../common/decorators/owner-role.decorator';

@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Post('register')
  async registerOwner(@Body() registerOwnerDto: RegisterOwnerDto) {
    return this.ownerService.registerOwner(registerOwnerDto);
  }

  @Post('resend-otp')
  async resendOwnerOtp(@Body() resendOwnerOtpDto: ResendOwnerOtpDto) {
    return this.ownerService.resendOwnerOtp(resendOwnerOtpDto);
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async getDashboardStats(@Request() req) {
    return this.ownerService.getOwnerDashboardStats(req.user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Request() req
  ) {
    return this.ownerService.getAllUsers(req.user.id, page, limit);
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async getUserById(
    @Param('id') userId: string,
    @Request() req
  ) {
    return this.ownerService.getUserById(userId, req.user.id);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async deleteUser(
    @Param('id') userId: string,
    @Request() req
  ) {
    return this.ownerService.deleteUser(userId, req.user.id);
  }
} 