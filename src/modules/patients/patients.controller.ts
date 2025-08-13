import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Logger } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { Request } from 'express';

@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);
  
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_CREATE)
  create(@Body() createPatientDto: CreatePatientDto, @Req() req: Request) {
    // ✅ Passar o usuário logado para validações de escopo
    const adminUser = req['user'];
    return this.patientsService.create(createPatientDto, adminUser);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_VIEW)
  findAll(@Req() req: Request) {
    this.logger.log('=== ENDPOINT /api/patients (GET) ===');
    this.logger.log(`User ID: ${req['user']?.id}`);
    this.logger.log(`User Role: ${req['user']?.role}`);
    this.logger.log(`User Permissions: ${JSON.stringify(req['user']?.permissions)}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Authorization Header: ${req.headers.authorization}`);
    
    try {
      // ✅ Passar o usuário logado para filtros territoriais
      const adminUser = req['user'];
      const result = this.patientsService.findAll(adminUser);
      this.logger.log('✅ Sucesso ao buscar todos os pacientes');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar todos os pacientes:', error);
      throw error;
    }
  }

  // Endpoint específico para buscar pacientes por unidade de saúde
  @Get('by-health-unit/:healthUnitId')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_VIEW)
  findByHealthUnit(@Param('healthUnitId') healthUnitId: string, @Req() req: Request) {
    this.logger.log('=== ENDPOINT /api/patients/by-health-unit/:healthUnitId (GET) ===');
    this.logger.log(`Health Unit ID: ${healthUnitId}`);
    this.logger.log(`User ID: ${req['user']?.id}`);
    this.logger.log(`User Role: ${req['user']?.role}`);
    this.logger.log(`User Permissions: ${JSON.stringify(req['user']?.permissions)}`);
    this.logger.log(`User Health Unit ID: ${req['user']?.health_unit_id}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Authorization Header: ${req.headers.authorization}`);
    
    try {
      const result = this.patientsService.findByHealthUnit(healthUnitId);
      this.logger.log('✅ Sucesso ao buscar pacientes por unidade de saúde');
      return result;
    } catch (error) {
      this.logger.error('❌ Erro ao buscar pacientes por unidade de saúde:', error);
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_VIEW)
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_UPDATE)
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.PATIENT_DELETE)
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
} 