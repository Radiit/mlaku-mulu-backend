import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { ResendOwnerOtpDto } from './dto/resend-owner-otp.dto';
import { ResponseHelper } from '../common/utils/response';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    // Generate verification token (OTP) - using same format as auth service
    const verificationToken = this.generateOtp();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      const owner = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          phone,
          role: 'owner',
          isVerified: false, // Owner needs to verify OTP first
          verificationToken,
          tokenExpiry,
        },
      });

      // Send OTP email
      await this.emailService.sendOtpEmail(email, verificationToken);

      return ResponseHelper.created(
        {
          id: owner.id,
          email: owner.email,
          role: owner.role,
          isVerified: owner.isVerified,
          phone: owner.phone,
          name,
          message: 'Owner registered successfully. Please check your email for OTP verification.',
        },
        'Owner registered successfully. Please verify your email with OTP.'
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

  // Helper method to generate consistent OTP format (same as auth service)
  private generateOtp(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

  async resendOwnerOtp(resendOwnerOtpDto: ResendOwnerOtpDto) {
    const { email } = resendOwnerOtpDto;

    // Find owner by email
    const owner = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
      }
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    if (owner.role !== 'owner') {
      throw new BadRequestException('User is not an owner');
    }

    if (owner.isVerified) {
      throw new BadRequestException('Owner is already verified');
    }

    // Generate new verification token using same format as auth service
    const verificationToken = this.generateOtp();
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update verification token
    await this.prisma.user.update({
      where: { id: owner.id },
      data: {
        verificationToken,
        tokenExpiry,
      }
    });

    // Send new OTP email
    await this.emailService.sendOtpEmail(email, verificationToken);

    return ResponseHelper.success(
      { message: 'New OTP sent to your email' },
      'New OTP sent successfully'
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

  async getOwnerDashboardStats(currentUserId: string) {
    // Check if current user is owner
    const currentUser = await this.prisma.user.findUnique({ 
      where: { id: currentUserId },
      select: { role: true }
    });

    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    if (currentUser.role !== 'owner') {
      throw new ForbiddenException('Only owners can access dashboard stats');
    }

    // Get current date for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get user statistics
    const [
      totalUsers,
      totalTrips,
      verifiedUsers,
      unverifiedUsers,
      tripsThisMonth,
      tripsThisYear,
      roleCounts,
      recentTrips,
      topDestinations
    ] = await Promise.all([
      // Total users
      this.prisma.user.count(),
      
      // Total trips
      this.prisma.trip.count(),
      
      // Verified users
      this.prisma.user.count({ where: { isVerified: true } }),
      
      // Unverified users
      this.prisma.user.count({ where: { isVerified: false } }),
      
      // Trips this month
      this.prisma.trip.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      
      // Trips this year
      this.prisma.trip.count({
        where: { createdAt: { gte: startOfYear } }
      }),
      
      // Role distribution
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      
      // Recent trips (last 5)
      this.prisma.trip.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          turis: {
            select: { email: true, phone: true }
          }
        }
      }),
      
      // Top destinations
      this.prisma.trip.groupBy({
        by: ['destination'],
        _count: { destination: true },
        orderBy: { _count: { destination: 'desc' } },
        take: 5
      })
    ]);

    // Calculate role counts
    const roleStats = roleCounts.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average trips per user
    const averageTripsPerUser = totalUsers > 0 ? (totalTrips / totalUsers).toFixed(2) : '0';

    // Format recent trips
    const formattedRecentTrips = recentTrips.map(trip => ({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      turisEmail: trip.turis.email,
      turisPhone: trip.turis.phone,
      createdAt: trip.createdAt
    }));

    // Format top destinations
    const formattedTopDestinations = topDestinations.map(item => ({
      destination: item.destination,
      count: item._count.destination
    }));

    // Get monthly stats for current year
    const monthlyStats = await this.getMonthlyStats(now.getFullYear());

    const dashboardStats = {
      // User Overview
      userOverview: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) + '%' : '0%'
      },
      
      // Role Distribution
      roleDistribution: {
        owner: roleStats.owner || 0,
        pegawai: roleStats.pegawai || 0,
        turis: roleStats.turis || 0
      },
      
      // Trip Statistics
      tripStatistics: {
        totalTrips,
        tripsThisMonth,
        tripsThisYear,
        averageTripsPerUser,
        monthlyGrowth: this.calculateGrowthRate(tripsThisMonth, tripsThisYear)
      },
      
      // Top Destinations
      topDestinations: formattedTopDestinations,
      
      // Recent Activity
      recentActivity: {
        recentTrips: formattedRecentTrips,
        lastUpdated: now
      },
      
      // Monthly Trends
      monthlyTrends: monthlyStats,
      
      // System Health
      systemHealth: {
        totalActiveUsers: verifiedUsers,
        inactiveUsers: unverifiedUsers,
        dataLastUpdated: now
      }
    };

    return ResponseHelper.success(
      dashboardStats,
      'Owner dashboard stats retrieved successfully'
    );
  }

  private async getMonthlyStats(year: number) {
    const months: Array<{ month: string; trips: number; users: number; year: number }> = [];
    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const [trips, users] = await Promise.all([
        this.prisma.trip.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate } }
        })
      ]);

      months.push({
        month: startDate.toLocaleString('default', { month: 'long' }),
        trips,
        users,
        year
      });
    }
    
    return months;
  }

  private calculateGrowthRate(current: number, total: number): string {
    if (total === 0) return '0%';
    const growth = ((current / total) * 100).toFixed(1);
    return `${growth}%`;
  }
} 