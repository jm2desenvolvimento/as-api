import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicalScheduleDto } from './dto/create-medical-schedule.dto';
import { UpdateMedicalScheduleDto } from './dto/update-medical-schedule.dto';

@Injectable()
export class MedicalSchedulesService {
  constructor(private prisma: PrismaService) {}

  private async getUserScope(user: any) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new ForbiddenException('Usuário não encontrado');
    return dbUser; // { id, role, city_id, health_unit_id }
  }

  async create(createMedicalScheduleDto: CreateMedicalScheduleDto, user: any) {
    try {
      const dbUser = await this.getUserScope(user);
      // Verificar se o médico existe
      const doctor = await this.prisma.user.findUnique({
        where: { id: createMedicalScheduleDto.doctor_id },
        include: { 
          profile: { 
            include: { 
              profile_doctor: true 
            } 
          } 
        }
      });

      if (!doctor || !doctor.profile?.profile_doctor) {
        throw new BadRequestException('Médico não encontrado ou perfil inválido');
      }

      // Verificar se a unidade de saúde existe
      const healthUnit = await this.prisma.health_unit.findUnique({
        where: { id: createMedicalScheduleDto.health_unit_id }
      });

      if (!healthUnit) {
        throw new BadRequestException('Unidade de saúde não encontrada');
      }

      // Escopo: ADMIN só pode criar para sua prefeitura e, se tiver, para sua unidade específica
      if (dbUser.role === 'ADMIN') {
        if (!dbUser.city_id) {
          throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode criar escalas médicas');
        }
        const unitCity = await this.prisma.health_unit.findUnique({ where: { id: createMedicalScheduleDto.health_unit_id } });
        if (!unitCity || unitCity.city_hall_id !== dbUser.city_id) {
          throw new ForbiddenException('Unidade de saúde fora da prefeitura do ADMIN');
        }
        if (dbUser.health_unit_id && dbUser.health_unit_id !== createMedicalScheduleDto.health_unit_id) {
          throw new ForbiddenException('ADMIN restrito à sua unidade de saúde');
        }
      }

      // Verificar se médico substituto existe (se fornecido)
      if (createMedicalScheduleDto.substitute_doctor_id) {
        const substituteDoctor = await this.prisma.user.findUnique({
          where: { id: createMedicalScheduleDto.substitute_doctor_id },
          include: { 
            profile: { 
              include: { 
                profile_doctor: true 
              } 
            } 
          }
        });

        if (!substituteDoctor || !substituteDoctor.profile?.profile_doctor) {
          throw new BadRequestException('Médico substituto não encontrado ou perfil inválido');
        }
      }

      // Verificar conflitos de horário para o mesmo médico
      const conflictingSchedule = await this.prisma.medical_schedule.findFirst({
        where: {
          doctor_id: createMedicalScheduleDto.doctor_id,
          OR: [
            {
              AND: [
                { start_datetime: { lte: new Date(createMedicalScheduleDto.start_datetime) } },
                { end_datetime: { gt: new Date(createMedicalScheduleDto.start_datetime) } }
              ]
            },
            {
              AND: [
                { start_datetime: { lt: new Date(createMedicalScheduleDto.end_datetime) } },
                { end_datetime: { gte: new Date(createMedicalScheduleDto.end_datetime) } }
              ]
            }
          ],
          status: { not: 'cancelled' }
        }
      });

      if (conflictingSchedule) {
        throw new BadRequestException('Já existe uma escala para este médico no horário especificado');
      }

      // Log detalhado dos dados antes da criação
      console.log('🔍 [DEBUG] Dados para criação da escala:', {
        doctor_id: createMedicalScheduleDto.doctor_id,
        health_unit_id: createMedicalScheduleDto.health_unit_id,
        substitute_doctor_id: createMedicalScheduleDto.substitute_doctor_id,
        start_datetime: createMedicalScheduleDto.start_datetime,
        end_datetime: createMedicalScheduleDto.end_datetime
      });

      // Verificar se o médico existe ANTES da criação
      const doctorExists = await this.prisma.user.findUnique({
        where: { id: createMedicalScheduleDto.doctor_id }
      });
      console.log('🔍 [DEBUG] Médico existe?', { 
        doctor_id: createMedicalScheduleDto.doctor_id, 
        exists: !!doctorExists,
        doctor_data: doctorExists ? { id: doctorExists.id, role: doctorExists.role } : null
      });

      // Verificar se a UBS existe ANTES da criação
      const healthUnitExists = await this.prisma.health_unit.findUnique({
        where: { id: createMedicalScheduleDto.health_unit_id }
      });
      console.log('🔍 [DEBUG] UBS existe?', { 
        health_unit_id: createMedicalScheduleDto.health_unit_id, 
        exists: !!healthUnitExists,
        ubs_data: healthUnitExists ? { id: healthUnitExists.id, name: healthUnitExists.name } : null
      });

      // Verificar médico substituto se fornecido
      if (createMedicalScheduleDto.substitute_doctor_id) {
        const substituteExists = await this.prisma.user.findUnique({
          where: { id: createMedicalScheduleDto.substitute_doctor_id }
        });
        console.log('🔍 [DEBUG] Médico substituto existe?', { 
          substitute_id: createMedicalScheduleDto.substitute_doctor_id, 
          exists: !!substituteExists
        });
      }

      // Log detalhado dos dados que serão enviados para o Prisma
      const prismaData = {
        ...createMedicalScheduleDto,
        start_datetime: new Date(createMedicalScheduleDto.start_datetime),
        end_datetime: new Date(createMedicalScheduleDto.end_datetime),
        total_slots: createMedicalScheduleDto.total_slots || 0,
        available_slots: createMedicalScheduleDto.available_slots || 0,
        recurrence_end_date: createMedicalScheduleDto.recurrence_end_date 
          ? new Date(createMedicalScheduleDto.recurrence_end_date) 
          : null,
        // Campos obrigatórios com valores padrão
        recurrence_weekdays: createMedicalScheduleDto.recurrence_weekdays || null,
        rrule: createMedicalScheduleDto.rrule || null,
        exdates: createMedicalScheduleDto.exdates || [],
        timezone: createMedicalScheduleDto.timezone || null,
        substitute_doctor_id: createMedicalScheduleDto.substitute_doctor_id || null,
        notes: createMedicalScheduleDto.notes || null,
      };
      
      console.log('🔍 [DEBUG] Dados que serão enviados para o Prisma:', JSON.stringify(prismaData, null, 2));
      console.log('🔍 [DEBUG] Tipo dos dados:', {
        doctor_id: typeof prismaData.doctor_id,
        health_unit_id: typeof prismaData.health_unit_id,
        start_datetime: typeof prismaData.start_datetime,
        end_datetime: typeof prismaData.end_datetime,
        status: typeof prismaData.status,
        total_slots: typeof prismaData.total_slots,
        available_slots: typeof prismaData.available_slots,
        is_recurring: typeof prismaData.is_recurring,
        recurrence_type: typeof prismaData.recurrence_type,
        recurrence_end_date: typeof prismaData.recurrence_end_date,
        recurrence_weekdays: typeof prismaData.recurrence_weekdays,
        rrule: typeof prismaData.rrule,
        exdates: typeof prismaData.exdates,
        timezone: typeof prismaData.timezone,
        substitute_doctor_id: typeof prismaData.substitute_doctor_id,
        notes: typeof prismaData.notes
      });
      
      // Log específico para campos críticos
      console.log('🔍 [DEBUG] Valores críticos:', {
        status: prismaData.status,
        recurrence_type: prismaData.recurrence_type,
        is_recurring: prismaData.is_recurring,
        recurrence_weekdays: prismaData.recurrence_weekdays
      });
      
      // Log para verificar se há problemas com enums
      console.log('🔍 [DEBUG] Verificação de enums:', {
        status_valid: ['pending', 'confirmed', 'temporary', 'cancelled'].includes(prismaData.status || ''),
        recurrence_type_valid: ['none', 'daily', 'weekly', 'monthly'].includes(prismaData.recurrence_type || ''),
        is_recurring_valid: typeof prismaData.is_recurring === 'boolean'
      });
      
      // Forçar valores corretos para enums
      if (!prismaData.recurrence_type) {
        prismaData.recurrence_type = 'none';
      }
      if (!prismaData.status) {
        prismaData.status = 'pending';
      }
      
      console.log('🔍 [DEBUG] Dados finais para Prisma:', {
        recurrence_type: prismaData.recurrence_type,
        status: prismaData.status,
        is_recurring: prismaData.is_recurring
      });

      const medicalSchedule = await this.prisma.medical_schedule.create({
        data: prismaData,
        include: {
          doctor: {
            include: {
              profile: {
                include: {
                  profile_doctor: true
                }
              }
            }
          },
          health_unit: true,
          substitute_doctor: {
            include: {
              profile: {
                include: {
                  profile_doctor: true
                }
              }
            }
          }
        }
      });

      return medicalSchedule;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar escala médica: ' + error.message);
    }
  }

  async findAll(user: any, healthUnitId?: string, doctorId?: string, status?: string) {
    const dbUser = await this.getUserScope(user);
    const where: any = {};

    if (healthUnitId) {
      where.health_unit_id = healthUnitId;
    }

    if (doctorId) {
      where.doctor_id = doctorId;
    }

    if (status) {
      where.status = status;
    }

    // Escopo por contexto do usuário
    if (dbUser.role === 'ADMIN') {
      if (dbUser.city_id) {
        where.health_unit = { is: { city_hall_id: dbUser.city_id } } as any;
      } else {
        // ADMIN sem prefeitura vinculada - não pode acessar escalas
        throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode acessar escalas médicas');
      }
      
      if (dbUser.health_unit_id) {
        where.health_unit_id = dbUser.health_unit_id;
      }
    }

    return this.prisma.medical_schedule.findMany({
      where,
      include: {
        doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        },
        health_unit: true,
        substitute_doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        }
      },
      orderBy: {
        start_datetime: 'asc'
      }
    });
  }

  async findOne(user: any, id: string) {
    const dbUser = await this.getUserScope(user);
    const medicalSchedule = await this.prisma.medical_schedule.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        },
        health_unit: true,
        substitute_doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        }
      }
    });

    if (!medicalSchedule) {
      throw new NotFoundException('Escala médica não encontrada');
    }

    // Escopo: ADMIN só acessa do seu contexto
    if (dbUser.role === 'ADMIN') {
      if (!dbUser.city_id) {
        throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode acessar escalas médicas');
      }
      
      // Buscar a unidade de saúde para verificar o city_hall_id
      const healthUnit = await this.prisma.health_unit.findUnique({
        where: { id: medicalSchedule.health_unit_id }
      });
      
      if (!healthUnit || healthUnit.city_hall_id !== dbUser.city_id) {
        throw new ForbiddenException('Acesso negado à escala fora do contexto');
      }
      
      if (dbUser.health_unit_id && medicalSchedule.health_unit_id !== dbUser.health_unit_id) {
        throw new ForbiddenException('Acesso negado à escala de outra unidade');
      }
    }

    return medicalSchedule;
  }

  async update(user: any, id: string, updateMedicalScheduleDto: UpdateMedicalScheduleDto) {
    try {
      const dbUser = await this.getUserScope(user);
      // Verificar se a escala existe
      const existingSchedule = await this.prisma.medical_schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new NotFoundException('Escala médica não encontrada');
      }

      // Escopo: ADMIN só pode alterar dentro do seu contexto
      if (dbUser.role === 'ADMIN') {
        if (!dbUser.city_id) {
          throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode alterar escalas médicas');
        }
        
        const unit = await this.prisma.health_unit.findUnique({ where: { id: existingSchedule.health_unit_id } });
        if (!unit || unit.city_hall_id !== dbUser.city_id) {
          throw new ForbiddenException('Escala fora do contexto do ADMIN');
        }
        if (dbUser.health_unit_id && dbUser.health_unit_id !== existingSchedule.health_unit_id) {
          throw new ForbiddenException('ADMIN restrito à sua unidade de saúde');
        }
        if (updateMedicalScheduleDto.health_unit_id && dbUser.health_unit_id && updateMedicalScheduleDto.health_unit_id !== dbUser.health_unit_id) {
          throw new ForbiddenException('ADMIN não pode mover escala para outra unidade');
        }
      }

      // Verificar se o médico existe (se fornecido)
      if (updateMedicalScheduleDto.doctor_id) {
        const doctor = await this.prisma.user.findUnique({
          where: { id: updateMedicalScheduleDto.doctor_id },
          include: { 
            profile: { 
              include: { 
                profile_doctor: true 
              } 
            } 
          }
        });

        if (!doctor || !doctor.profile?.profile_doctor) {
          throw new BadRequestException('Médico não encontrado ou perfil inválido');
        }
      }

      // Verificar se a unidade de saúde existe (se fornecida)
      if (updateMedicalScheduleDto.health_unit_id) {
        const healthUnit = await this.prisma.health_unit.findUnique({
          where: { id: updateMedicalScheduleDto.health_unit_id }
        });

        if (!healthUnit) {
          throw new BadRequestException('Unidade de saúde não encontrada');
        }
      }

      // Verificar se médico substituto existe (se fornecido)
      if (updateMedicalScheduleDto.substitute_doctor_id) {
        const substituteDoctor = await this.prisma.user.findUnique({
          where: { id: updateMedicalScheduleDto.substitute_doctor_id },
          include: { 
            profile: { 
              include: { 
                profile_doctor: true 
              } 
            } 
          }
        });

        if (!substituteDoctor || !substituteDoctor.profile?.profile_doctor) {
          throw new BadRequestException('Médico substituto não encontrado ou perfil inválido');
        }
      }

      // Preparar dados para atualização
      const updateData: any = { ...updateMedicalScheduleDto };

      if (updateMedicalScheduleDto.start_datetime) {
        updateData.start_datetime = new Date(updateMedicalScheduleDto.start_datetime);
      }

      if (updateMedicalScheduleDto.end_datetime) {
        updateData.end_datetime = new Date(updateMedicalScheduleDto.end_datetime);
      }

      if (updateMedicalScheduleDto.recurrence_end_date !== undefined) {
        updateData.recurrence_end_date = updateMedicalScheduleDto.recurrence_end_date 
          ? new Date(updateMedicalScheduleDto.recurrence_end_date) 
          : null;
      }

      const medicalSchedule = await this.prisma.medical_schedule.update({
        where: { id },
        data: updateData,
        include: {
          doctor: {
            include: {
              profile: {
                include: {
                  profile_doctor: true
                }
              }
            }
          },
          health_unit: true,
          substitute_doctor: {
            include: {
              profile: {
                include: {
                  profile_doctor: true
                }
              }
            }
          }
        }
      });

      return medicalSchedule;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar escala médica: ' + error.message);
    }
  }

  async remove(user: any, id: string) {
    try {
      const dbUser = await this.getUserScope(user);
      const existingSchedule = await this.prisma.medical_schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        throw new NotFoundException('Escala médica não encontrada');
      }

      if (dbUser.role === 'ADMIN') {
        if (!dbUser.city_id) {
          throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode remover escalas médicas');
        }
        
        const unit = await this.prisma.health_unit.findUnique({ where: { id: existingSchedule.health_unit_id } });
        if (!unit || unit.city_hall_id !== dbUser.city_id) {
          throw new ForbiddenException('Escala fora do contexto do ADMIN');
        }
        if (dbUser.health_unit_id && dbUser.health_unit_id !== existingSchedule.health_unit_id) {
          throw new ForbiddenException('ADMIN restrito à sua unidade de saúde');
        }
      }

      await this.prisma.medical_schedule.delete({
        where: { id }
      });

      return { message: 'Escala médica removida com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao remover escala médica: ' + error.message);
    }
  }

  async findByDateRange(user: any, startDate: string, endDate: string, healthUnitId?: string, doctorId?: string) {
    const dbUser = await this.getUserScope(user);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const where: any = {
      OR: [
        // Não recorrentes que sobrepõem o intervalo
        {
          AND: [
            { start_datetime: { lte: end } },
            { end_datetime: { gte: start } },
          ],
        },
        // Recorrentes (legacy flags)
        { is_recurring: true },
      ],
    };

    if (healthUnitId) {
      where.health_unit_id = healthUnitId;
    }

    if (doctorId) {
      where.doctor_id = doctorId;
    }

    // Limitar recorrentes por data de término de recorrência quando existir
    where.AND = [
      {
        OR: [
          { recurrence_end_date: null },
          { recurrence_end_date: { gte: start } },
        ],
      },
    ];

    // Escopo por contexto do usuário
    if (dbUser.role === 'ADMIN') {
      if (dbUser.city_id) {
        where.health_unit = { is: { city_hall_id: dbUser.city_id } } as any;
      } else {
        // ADMIN sem prefeitura vinculada - não pode acessar escalas
        throw new ForbiddenException('ADMIN sem prefeitura vinculada não pode acessar escalas médicas');
      }
      
      if (dbUser.health_unit_id) {
        where.health_unit_id = dbUser.health_unit_id;
      }
    }

    return this.prisma.medical_schedule.findMany({
      where,
      include: {
        doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        },
        health_unit: true,
        substitute_doctor: {
          include: {
            profile: {
              include: {
                profile_doctor: true
              }
            }
          }
        }
      },
      orderBy: {
        start_datetime: 'asc'
      }
    });
  }
}
