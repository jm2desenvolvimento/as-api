import { Module } from '@nestjs/common';
import { CityHallController } from './cityhall.controller';
import { CityHallService } from './cityhall.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [CityHallController],
  providers: [CityHallService, PrismaService],
})
export class CityHallModule {} 