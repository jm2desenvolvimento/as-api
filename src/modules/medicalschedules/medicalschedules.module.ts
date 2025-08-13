import { Module } from '@nestjs/common';
import { MedicalSchedulesService } from './medicalschedules.service';
import { MedicalSchedulesController } from './medicalschedules.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [MedicalSchedulesService, PrismaService],
  controllers: [MedicalSchedulesController],
  exports: [MedicalSchedulesService],
})
export class MedicalSchedulesModule {}
