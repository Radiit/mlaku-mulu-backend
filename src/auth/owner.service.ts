import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ResponseHelper } from '../common/utils/response';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  async registerOwner(registerOwnerDto: RegisterOwnerDto) {
    const { email, password, phone, name } = registerOwnerDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const owner = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role: 'owner',
          isVerified: true, // Owner is automatically verified
        },
      });

      return ResponseHelper.created(
        {
          id: owner.id,
          email: owner.email,
          role: owner.role,
          isVerified: owner.isVerified,
          phone: owner.phone,
          name,
        },
        'Owner registered successfully'
      );
    } catch (error) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new ConflictException('Email already registered');
        }
        if (error.meta?.target?.includes('phone')) {
          throw new ConflictException('Phone number already registered');
        }
        throw new ConflictException('User with this information already exists');
      }
      throw error;
    }
  }

  async assignRole(assignRoleDto: AssignRoleDto, currentUserId: string) {
    const { userId, role } = assignRoleDto;

    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can assign roles');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent changing owner role
    if (targetUser.role === 'owner' && role !== 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Update user role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
      }
    });

    return ResponseHelper.success(
      updatedUser,
      `User role updated to ${role} successfully`
    );
  }

  async updateUserRole(userId: string, updateRoleDto: UpdateUserRoleDto, currentUserId: string) {
    const { role } = updateRoleDto;

    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can update user roles');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent changing owner role
    if (targetUser.role === 'owner' && role !== 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Update user role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
      }
    });

    return ResponseHelper.success(
      updatedUser,
      `User role updated to ${role} successfully`
    );
  }

  async getAllUsers(currentUserId: string, page: number = 1, limit: number = 10) {
    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can view all users');
    }

    const skip = (page - 1) * limit;
    const total = await this.prisma.user.count();

    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const meta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
      nextPage: page < Math.ceil(total / limit) ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };

    return ResponseHelper.success(
      users,
      'Users retrieved successfully',
      200,
      meta
    );
  }

  async getUserById(userId: string, currentUserId: string) {
    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can view user details');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return ResponseHelper.success(
      user,
      'User retrieved successfully'
    );
  }

  async deleteUser(userId: string, currentUserId: string) {
    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can delete users');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent deleting owner
    if (targetUser.role === 'owner') {
      throw new ForbiddenException('Cannot delete owner account');
    }

    // Delete user
    await this.prisma.user.delete({ where: { id: userId } });

    return ResponseHelper.success(
      { message: 'User deleted successfully' },
      'User deleted successfully'
    );
  }
} 