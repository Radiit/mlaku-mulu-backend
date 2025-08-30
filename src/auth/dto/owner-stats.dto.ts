export interface OwnerStatsDto {
  totalUsers: number;
  totalTrips: number;
  totalPegawai: number;
  totalTuris: number;
  totalOwner: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  tripsThisMonth: number;
  tripsThisYear: number;
  averageTripsPerUser: number;
  topDestinations: Array<{
    destination: string;
    count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    trips: number;
    users: number;
  }>;
  recentActivity: Array<{
    type: 'user_registered' | 'trip_created' | 'trip_updated' | 'trip_deleted';
    description: string;
    timestamp: Date;
    userId?: string;
    tripId?: string;
  }>;
} 