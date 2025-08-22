import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CityHallModule } from './modules/cityhall/cityhall.module';
import { PermissionModule } from './modules/permission/permission.module';
import { UsersModule } from './modules/users/users.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { HealthUnitModule } from './modules/healthunit/healthunit.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { MedicalRecordsModule } from './modules/medicalrecords/medicalrecords.module';
import { MedicalSchedulesModule } from './modules/medicalschedules/medicalschedules.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CityHallModule,
    PermissionModule,
    UsersModule,
    RolePermissionModule,
    HealthUnitModule,
    PatientsModule,
    DoctorsModule,
    MedicalRecordsModule,
    MedicalSchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
