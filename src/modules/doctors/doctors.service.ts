import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DoctorsService {
  private prisma = new PrismaClient();

  async create(dto: CreateDoctorDto, adminUser: any) {
    console.log('DTO recebido no backend:', JSON.stringify(dto, null, 2));
    
    // ✅ VALIDAÇÕES DE ESCOPO TERRITORIAL
    await this.validateTerritorialScope(dto, adminUser);
    
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        cpf: dto.cpf,
        role: 'DOCTOR',
        // ✅ NOVOS CAMPOS DE VINCULAÇÃO:
        city_id: dto.city_id,        // Prefeitura
        health_unit_id: dto.health_unit_id, // UBS
        profile: {
          create: {
            name: dto.name,
            birth_date: dto.birth_date,
            gender: dto.gender,
            profile_doctor: {
              create: {
                crm_number: dto.crm_number,
                crm_uf: dto.crm_uf,
                specialty: dto.specialty, // ✅ ESPECIALIDADE
              },
            },
            profile_phones: {
              create: dto.phones,
            },
            profile_emails: {
              create: dto.emails,
            },
            profile_addresses: {
              create: dto.addresses,
            },
          },
        },
      },
      include: {
        profile: {
          include: {
            profile_doctor: true,
            profile_phones: true,
            profile_emails: true,
            profile_addresses: true,
          },
        },
      },
    });
  }

  // ✅ NOVO MÉTODO: VALIDAÇÃO DE ESCOPO TERRITORIAL
  private async validateTerritorialScope(dto: CreateDoctorDto, adminUser: any) {
    // Verificar se a prefeitura existe
    const cityHall = await this.prisma.city_hall.findUnique({
      where: { id: dto.city_id }
    });
    
    if (!cityHall) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se a UBS existe e pertence à prefeitura
    const healthUnit = await this.prisma.health_unit.findUnique({
      where: { 
        id: dto.health_unit_id,
        city_hall_id: dto.city_id // Garantir que pertence à prefeitura
      }
    });
    
    if (!healthUnit) {
      throw new NotFoundException('UBS não encontrada ou não pertence à prefeitura informada');
    }

    // ✅ VALIDAÇÃO DE ESCOPO: ADMIN só pode cadastrar na sua prefeitura
    if (adminUser.role === 'ADMIN') {
      if (dto.city_id !== adminUser.city_id) {
        throw new ForbiddenException('Você só pode cadastrar médicos na sua prefeitura');
      }
    }
  }

  async findAll(adminUser?: any) {
    // ✅ FILTROS TERRITORIAIS baseados no usuário logado
    const where: any = { role: 'DOCTOR' };
    
    // ✅ ADMIN só vê médicos da sua prefeitura
    if (adminUser?.role === 'ADMIN') {
      where.city_id = adminUser.city_id;
      
      // ✅ Se tiver UBS específica, filtrar por ela também
      if (adminUser.health_unit_id) {
        where.health_unit_id = adminUser.health_unit_id;
      }
    }
    
    return this.prisma.user.findMany({
      where,
      select: {
        // ✅ CAMPOS BÁSICOS DO USUÁRIO
        id: true,
        email: true,
        cpf: true,
        role: true,
        city_id: true,
        health_unit_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        // ✅ PERFIL DO MÉDICO
        profile: {
          select: {
            id: true,
            name: true, // ✅ NOME ESTÁ AQUI
            birth_date: true,
            gender: true,
            profile_doctor: {
              select: {
                id: true,
                crm_number: true,
                crm_uf: true,
                specialty: true,
              }
            },
            profile_phones: {
              select: {
                id: true,
                phone: true,
                phone_type: true,
                is_primary: true
              }
            },
            profile_emails: {
              select: {
                id: true,
                email: true
              }
            },
            profile_addresses: {
              select: {
                id: true,
                address: true,
                number: true,
                complement: true,
                district: true,
                city: true,
                state: true,
                zip_code: true,
                address_type: true,
                is_primary: true
              }
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        // ✅ CAMPOS BÁSICOS DO USUÁRIO
        id: true,
        email: true,
        cpf: true,
        role: true,
        city_id: true,
        health_unit_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        // ✅ PERFIL DO MÉDICO
        profile: {
          select: {
            id: true,
            name: true, // ✅ NOME ESTÁ AQUI
            birth_date: true,
            gender: true,
            profile_doctor: {
              select: {
                id: true,
                crm_number: true,
                crm_uf: true,
                specialty: true,
              }
            },
            profile_phones: {
              select: {
                id: true,
                phone: true,
                phone_type: true,
                is_primary: true
              }
            },
            profile_emails: {
              select: {
                id: true,
                email: true
              }
            },
            profile_addresses: {
              select: {
                id: true,
                address: true,
                number: true,
                complement: true,
                district: true,
                city: true,
                state: true,
                zip_code: true,
                address_type: true,
                is_primary: true
              }
            },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateDoctorDto) {
    // Atualização simplificada: remove e recria contatos/endereços se enviados
    const data: any = {
      email: dto.email,
      cpf: dto.cpf,
      password: dto.password ? await bcrypt.hash(dto.password, 10) : undefined,
      profile: {
        update: {
          name: dto.name,
          birth_date: dto.birth_date,
          gender: dto.gender,
          profile_doctor: dto.crm_number || dto.crm_uf ? {
            update: {
              crm_number: dto.crm_number,
              crm_uf: dto.crm_uf,
            },
          } : undefined,
          profile_phones: dto.phones ? {
            deleteMany: {},
            create: dto.phones,
          } : undefined,
          profile_emails: dto.emails ? {
            deleteMany: {},
            create: dto.emails,
          } : undefined,
          profile_addresses: dto.addresses ? {
            deleteMany: {},
            create: dto.addresses,
          } : undefined,
        },
      },
    };
    // Remove campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    if (data.profile) {
      Object.keys(data.profile.update).forEach(key => data.profile.update[key] === undefined && delete data.profile.update[key]);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        // ✅ CAMPOS BÁSICOS DO USUÁRIO
        id: true,
        email: true,
        cpf: true,
        role: true,
        city_id: true,
        health_unit_id: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        // ✅ PERFIL DO MÉDICO
        profile: {
          select: {
            id: true,
            name: true, // ✅ NOME ESTÁ AQUI
            birth_date: true,
            gender: true,
            profile_doctor: {
              select: {
                id: true,
                crm_number: true,
                crm_uf: true,
                specialty: true,
              }
            },
            profile_phones: {
              select: {
                id: true,
                phone: true,
                phone_type: true,
                is_primary: true
              }
            },
            profile_emails: {
              select: {
                id: true,
                email: true
              }
            },
            profile_addresses: {
              select: {
                id: true,
                address: true,
                number: true,
                complement: true,
                district: true,
                city: true,
                state: true,
                zip_code: true,
                address_type: true,
                is_primary: true
              }
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
} 