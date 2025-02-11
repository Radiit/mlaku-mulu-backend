import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { Prisma } from '@prisma/client';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, TripsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
