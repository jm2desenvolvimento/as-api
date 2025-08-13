import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { AuthModule } from '../auth/auth.module';
import { MedicalRecordsModule } from '../medicalrecords/medicalrecords.module';

@Module({
  imports: [AuthModule, MedicalRecordsModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}