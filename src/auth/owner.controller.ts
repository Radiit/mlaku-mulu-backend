import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
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

  @Post('assign-role')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req
  ) {
    return this.ownerService.assignRole(assignRoleDto, req.user.id);
  }

  @Put('users/:id/role')
  @UseGuards(JwtAuthGuard, OwnerRoleGuard)
  @OwnerRole()
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req
  ) {
    return this.ownerService.updateUserRole(userId, updateRoleDto, req.user.id);
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