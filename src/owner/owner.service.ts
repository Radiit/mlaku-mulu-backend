import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OwnerStatsDto } from '../auth/dto/owner-stats.dto';
import { ResponseHelper } from '../common/utils/response';

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<OwnerStatsDto> {
    // Get basic counts
    const [
      totalUsers,
      totalTrips,
      totalPegawai,
      totalTuris,
      totalOwner,
      verifiedUsers,
      unverifiedUsers
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.trip.count(),
      this.prisma.user.count({ where: { role: 'pegawai' } }),
      this.prisma.user.count({ where: { role: 'turis' } }),
      this.prisma.user.count({ where: { role: 'owner' } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isVerified: false } })
    ]);

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfYear = new Date(currentYear, 0, 1);

    // Get trips for current month and year
    const [tripsThisMonth, tripsThisYear] = await Promise.all([
      this.prisma.trip.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      this.prisma.trip.count({
        where: {
          createdAt: {
            gte: startOfYear
          }
        }
      })
    ]);

    // Calculate average trips per user
    const averageTripsPerUser = totalUsers > 0 ? (totalTrips / totalUsers) : 0;

    // Get top destinations
    const topDestinations = await this.prisma.trip.groupBy({
      by: ['destination'],
      _count: {
        destination: true
      },
      orderBy: {
        _count: {
          destination: 'desc'
        }
      },
      take: 5
    });

    // Get monthly stats for the last 12 months
    const monthlyStats: Array<{ month: string; trips: number; users: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentYear, currentMonth - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i + 1, 0);
      
      const [monthTrips, monthUsers] = await Promise.all([
        this.prisma.trip.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
      ]);

      monthlyStats.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        trips: monthTrips,
        users: monthUsers
      });
    }

    // Get recent activity (last 20 activities)
    const recentActivity: Array<{
      type: 'user_registered' | 'trip_created' | 'trip_updated' | 'trip_deleted';
      description: string;
      timestamp: Date;
      userId?: string;
      tripId?: string;
    }> = [];
    
    // Recent user registrations
    const recentUsers = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    recentUsers.forEach(user => {
      recentActivity.push({
        type: 'user_registered' as const,
        description: `User ${user.email} (${user.role}) registered`,
        timestamp: user.createdAt,
        userId: user.id
      });
    });

    // Recent trips
    const recentTrips = await this.prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, destination: true, createdAt: true, turisId: true }
    });

    recentTrips.forEach(trip => {
      recentActivity.push({
        type: 'trip_created' as const,
        description: `Trip to ${JSON.stringify(trip.destination)} created`,
        timestamp: trip.createdAt,
        tripId: trip.id
      });
    });

    // Sort by timestamp and take top 20
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const top20Activity = recentActivity.slice(0, 20);

    return {
      totalUsers,
      totalTrips,
      totalPegawai,
      totalTuris,
      totalOwner,
      verifiedUsers,
      unverifiedUsers,
      tripsThisMonth,
      tripsThisYear,
      averageTripsPerUser: Math.round(averageTripsPerUser * 100) / 100,
      topDestinations: topDestinations.map(item => ({
        destination: JSON.stringify(item.destination),
        count: item._count.destination
      })),
      monthlyStats,
      recentActivity: top20Activity
    };
  }

  async getUserAnalytics() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            trips: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return ResponseHelper.success(
      users.map(user => ({
        ...user,
        tripCount: user._count.trips
      })),
      'User analytics retrieved successfully'
    );
  }

  async getTripAnalytics() {
    const trips = await this.prisma.trip.findMany({
      include: {
        turis: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group trips by destination
    const destinationStats = trips.reduce((acc, trip) => {
      const dest = JSON.stringify(trip.destination);
      if (!acc[dest]) {
        acc[dest] = { count: 0, totalDuration: 0 };
      }
      acc[dest].count++;
      acc[dest].totalDuration += (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24); // days
      return acc;
    }, {} as Record<string, { count: number; totalDuration: number }>);

    const destinationArray = Object.entries(destinationStats).map(([destination, stats]) => ({
      destination,
      count: stats.count,
      averageDuration: Math.round((stats.totalDuration / stats.count) * 100) / 100
    }));

    return ResponseHelper.success(
      {
        totalTrips: trips.length,
        destinationStats: destinationArray,
        trips: trips.slice(0, 50) // Limit to last 50 trips
      },
      'Trip analytics retrieved successfully'
    );
  }

  async getSystemHealth() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      recentUsers,
      recentTrips,
      totalUsers,
      totalTrips
    ] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: oneHourAgo } }
      }),
      this.prisma.trip.count({
        where: { createdAt: { gte: oneHourAgo } }
      }),
      this.prisma.user.count(),
      this.prisma.trip.count()
    ]);

    const healthScore = this.calculateHealthScore(recentUsers, recentTrips, totalUsers, totalTrips);

    return ResponseHelper.success(
      {
        status: healthScore > 70 ? 'healthy' : healthScore > 40 ? 'warning' : 'critical',
        score: healthScore,
        metrics: {
          recentUsers,
          recentTrips,
          totalUsers,
          totalTrips,
          lastChecked: now
        }
      },
      'System health check completed'
    );
  }

  private calculateHealthScore(recentUsers: number, recentTrips: number, totalUsers: number, totalTrips: number): number {
    let score = 100;

    // Deduct points for low activity
    if (recentUsers === 0) score -= 20;
    if (recentTrips === 0) score -= 20;

    // Deduct points for very low totals
    if (totalUsers < 5) score -= 15;
    if (totalTrips < 3) score -= 15;

    // Add points for good activity
    if (recentUsers > 0) score += 10;
    if (recentTrips > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }
} 