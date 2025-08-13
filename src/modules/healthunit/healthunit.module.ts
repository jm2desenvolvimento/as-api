import { Module } from '@nestjs/common';
import { HealthUnitController } from './healthunit.controller';
import { HealthUnitService } from './healthunit.service';

@Module({
  controllers: [HealthUnitController],
  providers: [HealthUnitService],
  exports: [HealthUnitService],
})
export class HealthUnitModule {}
