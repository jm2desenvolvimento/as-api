import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { Request } from 'express';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_CREATE)
  create(@Body() dto: CreateDoctorDto, @Req() req: Request) {
    // ✅ Passar o usuário logado para validações de escopo
    const adminUser = req['user'];
    return this.doctorsService.create(dto, adminUser);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_VIEW)
  findAll(@Req() req: Request) {
    // ✅ Passar o usuário logado para filtros territoriais
    const adminUser = req['user'];
    return this.doctorsService.findAll(adminUser);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_VIEW)
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.DOCTOR_DELETE)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}