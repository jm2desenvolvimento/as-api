import { Injectable, ConflictException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { MedicalRecordsService } from '../medicalrecords/medicalrecords.service';

const prisma = new PrismaClient();

@Injectable()
export class PatientsService {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}
  
  async create(createPatientDto: CreatePatientDto, adminUser: any) {
    try {
      // ✅ VALIDAÇÕES DE ESCOPO TERRITORIAL
      await this.validateTerritorialScope(createPatientDto, adminUser);
      
      // Verificar se já existe usuário com o CPF informado
      const existingUser = await prisma.user.findUnique({
        where: { cpf: createPatientDto.cpf }
      });
      
      if (existingUser) {
        throw new ConflictException(`Já existe um usuário com o CPF ${createPatientDto.cpf}`); 
      }
      
      // Criar usuário e perfil em uma transação
      const result = await prisma.$transaction(async (tx) => {
        // Criar usuário COM VINCULAÇÃO TERRITORIAL
        const user = await tx.user.create({
          data: {
            email: createPatientDto.email,
            password: createPatientDto.password, // TODO: Implementar hash
            cpf: createPatientDto.cpf,
            role: 'PATIENT',
            is_active: true,
            // ✅ NOVOS CAMPOS DE VINCULAÇÃO:
            city_id: createPatientDto.city_id,        // Prefeitura
            health_unit_id: createPatientDto.health_unit_id, // UBS
          }
        });

        // Criar perfil
        const profile = await tx.profile.create({
          data: {
            user_id: user.id,
            name: createPatientDto.name,
            birth_date: new Date(createPatientDto.birth_date),
            gender: createPatientDto.gender,
            sus_card: createPatientDto.sus_card,
          }
        });

        // Criar telefones
        if (createPatientDto.phones && createPatientDto.phones.length > 0) {
          await tx.profile_phone.createMany({
            data: createPatientDto.phones.map(phone => ({
              profile_id: profile.id,
              phone: phone.phone,
              phone_type: phone.phone_type,
              is_primary: phone.is_primary,
            }))
          });
        }

        // Criar emails alternativos
        if (createPatientDto.emails && createPatientDto.emails.length > 0) {
          await tx.profile_email.createMany({
            data: createPatientDto.emails.map(email => ({
              profile_id: profile.id,
              email: email.email,
              is_primary: false,
            }))
          });
        }

        // Criar endereços
        if (createPatientDto.addresses && createPatientDto.addresses.length > 0) {
          await tx.profile_address.createMany({
            data: createPatientDto.addresses.map(address => ({
              profile_id: profile.id,
              address: address.address,
              number: address.number,
              complement: address.complement,
              district: address.district,
              city: address.city,
              state: address.state,
              zip_code: address.zip_code,
              address_type: address.address_type,
              is_primary: address.is_primary,
            }))
          });
        }

        return { user, profile };
      });

      // Buscar o paciente completo com todos os dados
      const patient = await this.findOne(result.user.id);
      
      // Criar automaticamente um prontuário médico para o paciente
      try {
        console.log(`Verificando prontuário para o paciente ${result.profile.id}`);
        // Buscar prontuário médico existente
        let medicalRecord = await this.medicalRecordsService.findMedicalRecordByPatientId(result.profile.id);
        
        // Se não encontrou, criar automaticamente
        if (!medicalRecord) {
          console.log(`Criando prontuário automático para o paciente ${result.profile.id}`);
          medicalRecord = await this.medicalRecordsService.createMedicalRecordForPatient(result.profile.id);
        }
        
        if (medicalRecord) {
          console.log('Prontuário médico encontrado/criado com sucesso:', medicalRecord.id);
        } else {
          throw new Error('Prontuário médico não foi criado corretamente');
        }
      } catch (error) {
        console.error('Erro ao criar prontuário médico automático:', error);
        // Lançar erro para interromper o fluxo se falhar a criação do prontuário
        // Isso é importante para garantir que o frontend saiba que houve um problema
        throw new InternalServerErrorException('Erro ao criar prontuário médico automático. Por favor, tente novamente.');
      }
      
      return patient;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error; // Repassar o erro de conflito
      }
      console.error('Erro ao criar paciente:', error);
      throw new InternalServerErrorException('Erro ao criar paciente. Por favor, tente novamente.');
    }
  }

  // ✅ NOVO MÉTODO: VALIDAÇÃO DE ESCOPO TERRITORIAL
  private async validateTerritorialScope(dto: CreatePatientDto, adminUser: any) {
    // Verificar se a prefeitura existe
    const cityHall = await prisma.city_hall.findUnique({
      where: { id: dto.city_id }
    });
    
    if (!cityHall) {
      throw new NotFoundException('Prefeitura não encontrada');
    }

    // Verificar se a UBS existe e pertence à prefeitura
    const healthUnit = await prisma.health_unit.findUnique({
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
        throw new ForbiddenException('Você só pode cadastrar pacientes na sua prefeitura');
      }
    }
  }

  async findAll(adminUser?: any) {
    // ✅ FILTROS TERRITORIAIS baseados no usuário logado
    const where: any = { 
      role: 'PATIENT',
      is_active: true 
    };
    
    // ✅ ADMIN só vê pacientes da sua prefeitura
    if (adminUser?.role === 'ADMIN') {
      where.city_id = adminUser.city_id;
      
      // ✅ Se tiver UBS específica, filtrar por ela também
      if (adminUser.health_unit_id) {
        where.health_unit_id = adminUser.health_unit_id;
      }
    }
    
    // ✅ DOCTOR só vê pacientes da sua UBS
    if (adminUser?.role === 'DOCTOR') {
      if (adminUser.health_unit_id) {
        where.health_unit_id = adminUser.health_unit_id;
      } else {
        // DOCTOR sem UBS vinculada não pode ver pacientes
        throw new ForbiddenException('Médico sem UBS vinculada não pode acessar prontuários');
      }
    }
    
    return prisma.user.findMany({
      where,
      include: {
        profile: {
          include: {
            profile_phones: true,
            profile_emails: true,
            profile_addresses: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const patient = await prisma.user.findFirst({
      where: {
        id,
        role: 'PATIENT',
        is_active: true,
      },
      include: {
        profile: {
          include: {
            profile_phones: true,
            profile_emails: true,
            profile_addresses: true,
          }
        }
      }
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    // Verificar se o paciente existe
    await this.findOne(id);

    // Atualizar em transação
    await prisma.$transaction(async (tx) => {
      // Atualizar usuário
      const userUpdateData: any = {};
      if (updatePatientDto.email) userUpdateData.email = updatePatientDto.email;
      if (updatePatientDto.cpf) userUpdateData.cpf = updatePatientDto.cpf;
      if (updatePatientDto.password) {
        userUpdateData.password = updatePatientDto.password; // TODO: Implementar hash
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id },
          data: userUpdateData
        });
      }

      // Atualizar perfil
      if (updatePatientDto.name || updatePatientDto.birth_date || updatePatientDto.gender || updatePatientDto.sus_card !== undefined) {
        const profileUpdateData: any = {};
        if (updatePatientDto.name) profileUpdateData.name = updatePatientDto.name;
        if (updatePatientDto.birth_date) profileUpdateData.birth_date = new Date(updatePatientDto.birth_date);
        if (updatePatientDto.gender) profileUpdateData.gender = updatePatientDto.gender;
        if (updatePatientDto.sus_card !== undefined) profileUpdateData.sus_card = updatePatientDto.sus_card;

        await tx.profile.update({
          where: { user_id: id },
          data: profileUpdateData
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    // Verificar se o paciente existe
    await this.findOne(id);

    // Soft delete - apenas desativar o usuário
    await prisma.user.update({
      where: { id },
      data: { is_active: false }
    });

    return { message: 'Paciente removido com sucesso' };
  }

  // Método para buscar pacientes por unidade de saúde
  // Por enquanto retorna todos os pacientes ativos, mas pode ser filtrado por região/cidade
  async findByHealthUnit(healthUnitId: string) {
    // Buscar informações da unidade de saúde para filtrar por região
    const healthUnit = await prisma.health_unit.findUnique({
      where: { id: healthUnitId },
      select: { city: true, state: true }
    });

    if (!healthUnit) {
      throw new NotFoundException('Unidade de saúde não encontrada');
    }

    // Buscar pacientes da mesma cidade/estado da unidade de saúde
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        is_active: true,
        profile: {
          profile_addresses: {
            some: {
              city: healthUnit.city,
              state: healthUnit.state,
            }
          }
        }
      },
      include: {
        profile: {
          include: {
            profile_phones: true,
            profile_emails: true,
            profile_addresses: true,
          }
        }
      },
      orderBy: {
        profile: {
          name: 'asc'
        }
      }
    });

    return patients;
  }
}