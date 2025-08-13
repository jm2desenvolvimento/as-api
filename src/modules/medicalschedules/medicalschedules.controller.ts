import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
  BadRequestException
} from '@nestjs/common';
import { MedicalSchedulesService } from './medicalschedules.service';
import { CreateMedicalScheduleDto } from './dto/create-medical-schedule.dto';
import { UpdateMedicalScheduleDto } from './dto/update-medical-schedule.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

// Helpers simples de validação
const isValidISODate = (s: string) => {
  if (!s) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
};

const isUUID = (id: string) => {
  if (!id) return false;
  // Aceita UUIDs padrão (qualquer versão)
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

@Controller('medical-schedules')
@UseGuards(PermissionsGuard)
export class MedicalSchedulesController {
  constructor(private readonly medicalSchedulesService: MedicalSchedulesService) {}

  @Post()
  @Permissions('medical_schedule_create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: any,
    @Body() 
    createMedicalScheduleDto: CreateMedicalScheduleDto
  ) {
    // Log detalhado do que está chegando no controller
    console.log('🔍 [CONTROLLER] DTO recebido:', JSON.stringify(createMedicalScheduleDto, null, 2));
    console.log('🔍 [CONTROLLER] Tipo do DTO:', typeof createMedicalScheduleDto);
    console.log('🔍 [CONTROLLER] Chaves do DTO:', Object.keys(createMedicalScheduleDto));
    
    return this.medicalSchedulesService.create(createMedicalScheduleDto, req.user);
  }

  @Get()
  @Permissions('medical_schedule_view')
  findAll(
    @Req() req: any,
    @Query('health_unit_id') healthUnitId?: string,
    @Query('doctor_id') doctorId?: string,
    @Query('status') status?: string
  ) {
    return this.medicalSchedulesService.findAll(req.user, healthUnitId, doctorId, status);
  }

  @Get('date-range')
  @Permissions('medical_schedule_view')
  findByDateRange(
    @Req() req: any,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('health_unit_id') healthUnitId?: string,
    @Query('doctor_id') doctorId?: string
  ) {
    // Validações defensivas para evitar 500 por erro de tipo/parse no Prisma/Postgres
    if (!startDate || !endDate) {
      throw new BadRequestException('start_date e end_date são obrigatórios (ISO 8601)');
    }
    if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
      throw new BadRequestException('Formato inválido: start_date/end_date devem ser datas ISO válidas');
    }
    if (healthUnitId && !isUUID(healthUnitId)) {
      throw new BadRequestException('health_unit_id deve ser um UUID válido');
    }
    if (doctorId && !isUUID(doctorId)) {
      throw new BadRequestException('doctor_id deve ser um UUID válido');
    }
    return this.medicalSchedulesService.findByDateRange(req.user, startDate, endDate, healthUnitId, doctorId);
  }

  @Get(':id')
  @Permissions('medical_schedule_view')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.medicalSchedulesService.findOne(req.user, id);
  }

  @Patch(':id')
  @Permissions('medical_schedule_update')
  update(
    @Req() req: any,
    @Param('id') id: string, 
    @Body() 
    updateMedicalScheduleDto: UpdateMedicalScheduleDto
  ) {
    return this.medicalSchedulesService.update(req.user, id, updateMedicalScheduleDto);
  }

  @Delete(':id')
  @Permissions('medical_schedule_delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.medicalSchedulesService.remove(req.user, id);
  }
}
