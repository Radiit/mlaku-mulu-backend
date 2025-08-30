import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for new Trip System...');

  // Clear existing data
  await prisma.booking.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Owner
  const ownerPassword = await bcrypt.hash('Owner123', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'admin@mlakumulu.com',
      password: ownerPassword,
      phone: '+6281234567890',
      role: 'owner',
      isVerified: true
    }
  });
  console.log('👑 Created owner:', owner.email);

  // Create Pegawai (Staff)
  const pegawaiData = [
    {
      email: 'pegawai1@mlakumulu.com',
      password: 'Pegawai123',
      phone: '+6281234567891',
      role: 'pegawai'
    },
    {
      email: 'pegawai2@mlaku-mulu.com',
      password: 'Pegawai123',
      phone: '+6281234567892',
      role: 'pegawai'
    },
    {
      email: 'pegawai3@mlaku-mulu.com',
      password: 'Pegawai123',
      phone: '+6281234567893',
      role: 'pegawai'
    }
  ];

  const pegawaiUsers: any[] = [];
  for (const pegawai of pegawaiData) {
    const hashedPassword = await bcrypt.hash(pegawai.password, 10);
    const user = await prisma.user.create({
      data: {
        email: pegawai.email,
        password: hashedPassword,
        phone: pegawai.phone,
        role: pegawai.role,
        isVerified: true
      }
    });
    pegawaiUsers.push(user);
    console.log('👷 Created pegawai:', user.email);
  }

  // Create Turis (Tourists)
  const turisData = [
    {
      email: 'turis1@example.com',
      password: 'Turis123',
      phone: '+6281234567900',
      role: 'turis'
    },
    {
      email: 'turis2@example.com',
      password: 'Turis123',
      phone: '+6281234567901',
      role: 'turis'
    },
    {
      email: 'turis3@example.com',
      password: 'Turis123',
      phone: '+6281234567902',
      role: 'turis'
    },
    {
      email: 'turis4@example.com',
      password: 'Turis123',
      phone: '+6281234567903',
      role: 'turis'
    },
    {
      email: 'turis5@example.com',
      password: 'Turis123',
      phone: '+6281234567904',
      role: 'turis'
    },
    {
      email: 'turis6@example.com',
      password: 'Turis123',
      phone: '+6281234567905',
      role: 'turis'
    },
    {
      email: 'turis7@example.com',
      password: 'Turis123',
      phone: '+6281234567906',
      role: 'turis'
    },
    {
      email: 'turis8@example.com',
      password: 'Turis123',
      phone: '+6281234567907',
      role: 'turis'
    }
  ];

  const turisUsers: any[] = [];
  for (const turis of turisData) {
    const hashedPassword = await bcrypt.hash(turis.password, 10);
    const user = await prisma.user.create({
      data: {
        email: turis.email,
        password: hashedPassword,
        phone: turis.phone,
        role: turis.role,
        isVerified: true
      }
    });
    turisUsers.push(user);
    console.log('🧳 Created turis:', user.email);
  }

  // Create Trips (Owner creates these)
  const destinations = [
    {
      name: 'Bali',
      location: 'Bali, Indonesia',
      description: 'Pulau Dewata dengan pantai indah dan budaya Hindu yang kaya',
      highlights: ['Pantai Kuta', 'Tanah Lot', 'Ubud', 'Seminyak'],
      coordinates: { lat: -8.4095, lng: 115.1889 }
    },
    {
      name: 'Yogyakarta',
      location: 'Yogyakarta, Indonesia',
      description: 'Kota budaya dengan candi Borobudur dan Prambanan',
      highlights: ['Candi Borobudur', 'Candi Prambanan', 'Malioboro', 'Keraton'],
      coordinates: { lat: -7.7971, lng: 110.3708 }
    },
    {
      name: 'Bandung',
      location: 'Bandung, Indonesia',
      description: 'Kota kembang dengan cuaca sejuk dan wisata kuliner',
      highlights: ['Tangkuban Perahu', 'Kawah Putih', 'Dago', 'Braga'],
      coordinates: { lat: -6.9175, lng: 107.6191 }
    },
    {
      name: 'Lombok',
      location: 'Lombok, Indonesia',
      description: 'Pulau dengan pantai eksotis dan Gunung Rinjani',
      highlights: ['Gili Islands', 'Gunung Rinjani', 'Pantai Pink', 'Sasak Village'],
      coordinates: { lat: -8.5833, lng: 116.1167 }
    },
    {
      name: 'Raja Ampat',
      location: 'Papua Barat, Indonesia',
      description: 'Surga bawah laut dengan keanekaragaman hayati terbaik',
      highlights: ['Diving', 'Snorkeling', 'Island Hopping', 'Bird Watching'],
      coordinates: { lat: -0.5000, lng: 130.0000 }
    }
  ];

  const tripData = [
    // Bali Trips
    {
      title: 'Bali Adventure Package',
      description: 'Paket wisata lengkap ke Bali dengan pemandu lokal',
      destination: destinations[0],
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-06'),
      maxCapacity: 15,
      price: 2500000
    },
    {
      title: 'Bali Cultural Tour',
      description: 'Tur budaya ke candi dan desa tradisional Bali',
      destination: destinations[0],
      startDate: new Date('2025-03-10'),
      endDate: new Date('2025-03-15'),
      maxCapacity: 12,
      price: 1800000
    },
    {
      title: 'Bali Beach & Spa',
      description: 'Relaxing trip dengan spa dan pantai eksotis',
      destination: destinations[0],
      startDate: new Date('2025-03-20'),
      endDate: new Date('2025-03-25'),
      maxCapacity: 10,
      price: 3000000
    },
    // Yogyakarta Trips
    {
      title: 'Yogyakarta Heritage Tour',
      description: 'Jelajahi warisan budaya Jawa di Yogyakarta',
      destination: destinations[1],
      startDate: new Date('2025-03-05'),
      endDate: new Date('2025-03-10'),
      maxCapacity: 20,
      price: 1500000
    },
    {
      title: 'Yogyakarta Culinary Adventure',
      description: 'Petualangan kuliner di kota gudeg',
      destination: destinations[1],
      startDate: new Date('2025-03-15'),
      endDate: new Date('2025-03-20'),
      maxCapacity: 15,
      price: 1200000
    },
    // Bandung Trips
    {
      title: 'Bandung Nature Escape',
      description: 'Escape ke alam Bandung yang sejuk',
      destination: destinations[2],
      startDate: new Date('2025-03-08'),
      endDate: new Date('2025-03-12'),
      maxCapacity: 18,
      price: 1000000
    },
    {
      title: 'Bandung Shopping & Food',
      description: 'Shopping dan kuliner di Paris van Java',
      destination: destinations[2],
      startDate: new Date('2025-03-25'),
      endDate: new Date('2025-03-29'),
      maxCapacity: 25,
      price: 800000
    },
    // Lombok Trips
    {
      title: 'Lombok Island Paradise',
      description: 'Petualangan di pulau Lombok yang eksotis',
      destination: destinations[3],
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-04-08'),
      maxCapacity: 12,
      price: 3500000
    },
    // Raja Ampat Trips
    {
      title: 'Raja Ampat Diving Expedition',
      description: 'Ekspedisi diving di surga bawah laut',
      destination: destinations[4],
      startDate: new Date('2025-04-10'),
      endDate: new Date('2025-04-17'),
      maxCapacity: 8,
      price: 5000000
    },
    {
      title: 'Raja Ampat Island Hopping',
      description: 'Island hopping di kepulauan Raja Ampat',
      destination: destinations[4],
      startDate: new Date('2025-04-20'),
      endDate: new Date('2025-04-27'),
      maxCapacity: 10,
      price: 4000000
    }
  ];

  const createdTrips: any[] = [];
  for (const trip of tripData) {
    const createdTrip = await prisma.trip.create({
      data: {
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        maxCapacity: trip.maxCapacity,
        currentBookings: 0,
        price: trip.price,
        status: 'active',
        ownerId: owner.id
      }
    });
    createdTrips.push(createdTrip);
    console.log('✈️ Created trip:', trip.title);
  }

  // Create some sample bookings
  const bookingData = [
    {
      tripId: createdTrips[0].id, // Bali Adventure
      userId: turisUsers[0].id,
      status: 'confirmed',
      notes: 'First time to Bali, very excited!'
    },
    {
      tripId: createdTrips[0].id, // Bali Adventure
      userId: turisUsers[1].id,
      status: 'pending',
      notes: 'Looking forward to the adventure'
    },
    {
      tripId: createdTrips[1].id, // Bali Cultural
      userId: turisUsers[2].id,
      status: 'confirmed',
      notes: 'Interested in Balinese culture'
    },
    {
      tripId: createdTrips[3].id, // Yogyakarta Heritage
      userId: turisUsers[3].id,
      status: 'confirmed',
      notes: 'Want to see Borobudur'
    },
    {
      tripId: createdTrips[5].id, // Bandung Nature
      userId: turisUsers[4].id,
      status: 'pending',
      notes: 'Need escape from city life'
    },
    {
      tripId: createdTrips[7].id, // Lombok Island
      userId: turisUsers[5].id,
      status: 'confirmed',
      notes: 'Dream destination!'
    }
  ];

  for (const booking of bookingData) {
    await prisma.booking.create({
      data: {
        tripId: booking.tripId,
        userId: booking.userId,
        status: booking.status,
        notes: booking.notes
      }
    });
    console.log('📅 Created booking for user:', turisUsers.find(u => u.id === booking.userId)?.email);

    // Update trip current bookings count
    if (booking.status === 'confirmed') {
      await prisma.trip.update({
        where: { id: booking.tripId },
        data: { currentBookings: { increment: 1 } }
      });
    }
  }

  // Create some unverified users for testing
  const unverifiedUsers = [
    {
      email: 'pending1@example.com',
      password: 'Pending123',
      phone: '+6281234567910',
      role: 'turis'
    },
    {
      email: 'pending2@example.com',
      password: 'Pending123',
      phone: '+6281234567911',
      role: 'pegawai'
    }
  ];

  for (const user of unverifiedUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        phone: user.phone,
        role: user.role,
        isVerified: false
      }
    });
    console.log('⏳ Created unverified user:', user.email);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   👑 Owner: 1`);
  console.log(`   👷 Pegawai: ${pegawaiUsers.length}`);
  console.log(`   🧳 Turis: ${turisUsers.length}`);
  console.log(`   ✈️ Trips: ${createdTrips.length}`);
  console.log(`   📅 Bookings: ${bookingData.length}`);
  console.log(`   ⏳ Unverified: ${unverifiedUsers.length}`);

  console.log('\n🔑 Test Credentials:');
  console.log('   Owner: admin@mlakumulu.com / Owner123');
  console.log('   Pegawai: pegawai1@mlakumulu.com / Pegawai123');
  console.log('   Turis: turis1@example.com / Turis123');

  console.log('\n🧪 Testing Tips:');
  console.log('   1. Login as owner to create/manage trips');
  console.log('   2. View available trips (public endpoint)');
  console.log('   3. Login as turis to book trips');
  console.log('   4. Login as pegawai to manage bookings');
  console.log('   5. Test trip CRUD operations as owner');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 