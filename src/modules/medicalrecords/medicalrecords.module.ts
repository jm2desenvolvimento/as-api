import { Module } from '@nestjs/common';
import { MedicalRecordsService } from './medicalrecords.service';
import { MedicalFilesService } from './medical-files.service';
import { MedicalRecordsController } from './medicalrecords.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

@Module({
  imports: [AuthModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService, MedicalFilesService, PrismaService, { provide: APP_PIPE, useClass: ValidationPipe }],
  exports: [MedicalRecordsService, MedicalFilesService],
})
export class MedicalRecordsModule {}
