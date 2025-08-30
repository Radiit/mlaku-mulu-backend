import { Module } from '@nestjs/common';
import { PegawaiController } from './pegawai.controller';
import { UsersModule } from '../users/users.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [UsersModule, TripsModule],
  controllers: [PegawaiController],
})
export class PegawaiModule {} 