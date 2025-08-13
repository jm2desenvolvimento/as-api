import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto,
  CreateConsultationDto,
  UpdateConsultationDto,
  CreateMedicationDto,
  UpdateMedicationDto,
  CreateExamDto,
  UpdateExamDto,
  CreateDocumentDto,
  UpdateDocumentDto
} from './dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  // Buscar prontuário médico por ID
  async findMedicalRecordById(id: string) {
    const medicalRecord = await this.prisma.medical_record.findUnique({
      where: { id },
      include: {
        patient: true,
        health_unit: true,
      },
    });

    if (!medicalRecord) {
      throw new NotFoundException(`Prontuário com ID ${id} não encontrado`);
    }

    return medicalRecord;
  }

  // Buscar prontuário médico por ID do paciente (APENAS BUSCA - NÃO CRIA)
  // 🔄 PADRONIZADO: Aceita tanto user.id quanto profile.id para flexibilidade
  async findMedicalRecordByPatientId(patientId: string) {
    console.log(`🔍 [BUSCA PRONTUÁRIO] ID recebido: ${patientId}`);
    
    // ETAPA 1: Tentar buscar diretamente assumindo que é profile.id
    let medicalRecord = await this.prisma.medical_record.findFirst({
      where: { patient_id: patientId },
      include: {
        patient: {
          include: {
            profile_phones: true,
            profile_addresses: true
          }
        },
        health_unit: true,
      },
    });

    if (medicalRecord) {
      console.log(`✅ [ENCONTRADO] Prontuário encontrado diretamente com profile.id: ${medicalRecord.id}`);
      return medicalRecord;
    }

    console.log(`🔍 [BUSCA ALTERNATIVA] Não encontrado com ID direto, tentando buscar user->profile`);
    
    // ETAPA 2: Se não encontrou, pode ser user.id - buscar o profile correspondente
    const user = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: { profile: true }
    });

    if (user && user.profile) {
      console.log(`📋 [USER ENCONTRADO] user.id: ${user.id} -> profile.id: ${user.profile.id}`);
      
      // Tentar novamente com o ID do perfil correto
      medicalRecord = await this.prisma.medical_record.findFirst({
        where: { patient_id: user.profile.id },
        include: {
          patient: {
            include: {
              profile_phones: true,
              profile_addresses: true
            }
          },
          health_unit: true,
        },
      });

      if (medicalRecord) {
        console.log(`✅ [ENCONTRADO] Prontuário encontrado com profile.id derivado: ${medicalRecord.id}`);
        return medicalRecord;
      }
    } else {
      console.log(`❌ [USER NÃO ENCONTRADO] Não foi possível encontrar user com ID: ${patientId}`);
    }

    console.log(`❌ [NÃO ENCONTRADO] Nenhum prontuário encontrado para ID: ${patientId}`);
    return null;
  }

  // Criar prontuário médico automaticamente para um paciente (MÉTODO SEPARADO)
  // ✅ PADRONIZADO: Garante uso consistente do profile.id
  async createMedicalRecordForPatient(patientId: string) {
    console.log(`📝 [CRIAR PRONTUÁRIO] Iniciando criação para ID: ${patientId}`);
    
    // Verificar se já existe um prontuário
    const existingRecord = await this.findMedicalRecordByPatientId(patientId);
    if (existingRecord) {
      console.log(`ℹ️ [JÁ EXISTE] Prontuário já existe: ${existingRecord.id}`);
      return existingRecord;
    }

    // Determinar o profile.id correto (aceita tanto user.id quanto profile.id)
    let profileId: string;
    let patientProfile;

    // ETAPA 1: Tentar buscar perfil diretamente (assumindo que é profile.id)
    patientProfile = await this.prisma.profile.findUnique({
      where: { id: patientId },
      include: {
        profile_phones: true,
        profile_addresses: true,
        user: true
      }
    });

    if (patientProfile) {
      profileId = patientId; // É profile.id
      console.log(`✅ [PERFIL DIRETO] Encontrado profile.id: ${profileId}`);
    } else {
      // ETAPA 2: Pode ser user.id, buscar o profile correspondente
      console.log(`🔍 [BUSCA USER] Tentando encontrar user.id: ${patientId}`);
      
      const user = await this.prisma.user.findUnique({
        where: { id: patientId },
        include: { profile: true }
      });

      if (!user || !user.profile) {
        throw new NotFoundException(`Não foi possível encontrar um perfil para o ID ${patientId}`);
      }

      profileId = user.profile.id;
      console.log(`📋 [USER->PROFILE] user.id: ${patientId} -> profile.id: ${profileId}`);
      
      // Buscar dados completos do perfil
      patientProfile = await this.prisma.profile.findUnique({
        where: { id: profileId },
        include: {
          profile_phones: true,
          profile_addresses: true,
          user: true
        }
      });
    }

    if (!patientProfile) {
      throw new NotFoundException(`Perfil de paciente com ID ${patientId} não encontrado`);
    }

    // Determinar a unidade de saúde (buscar uma padrão se não houver)
    const healthUnitId = patientProfile.user?.health_unit_id || 
      (await this.prisma.health_unit.findFirst())?.id;

    if (!healthUnitId) {
      throw new NotFoundException('Não foi possível determinar uma unidade de saúde para o prontuário');
    }

    // Criar um novo prontuário básico com os dados do paciente
    const newMedicalRecord = await this.prisma.medical_record.create({
      data: {
        patient: {
          connect: { id: profileId } // Usar o ID do perfil, não o ID do usuário
        },
        health_unit: {
          connect: { id: healthUnitId }
        },
        patient_name: patientProfile.name || 'Nome não informado',
        patient_cpf: patientProfile.user?.cpf || 'CPF não informado',
        patient_birth_date: patientProfile.birth_date ? 
          new Date(patientProfile.birth_date).toISOString().split('T')[0] : undefined,
        patient_gender: patientProfile.gender || undefined,
        patient_phone: patientProfile.profile_phones?.[0]?.phone || undefined,
        patient_email: patientProfile.user?.email || undefined,
        patient_address: patientProfile.profile_addresses?.[0] ? 
          `${patientProfile.profile_addresses[0].address}, ${patientProfile.profile_addresses[0].number} - ${patientProfile.profile_addresses[0].city}/${patientProfile.profile_addresses[0].state}` : 
          undefined,
        blood_type: undefined,
        height: undefined,
        weight: undefined,
        allergies: [],
        chronic_diseases: [],
        is_active: true
      },
      include: {
        patient: {
          include: {
            profile_phones: true,
            profile_addresses: true
          }
        },
        health_unit: true,
      },
    });

    console.log(`✅ [CRIADO COM SUCESSO] Prontuário criado:`);
    console.log(`   - ID do prontuário: ${newMedicalRecord.id}`);
    console.log(`   - patient_id (profile.id): ${profileId}`);
    console.log(`   - ID original recebido: ${patientId}`);
    return newMedicalRecord;
  }

  // Criar novo prontuário médico
  async createMedicalRecord(dto: CreateMedicalRecordDto) {
    const { patient_id, health_unit_id, ...rest } = dto;
    
    const data: Prisma.medical_recordCreateInput = {
      ...rest,
      patient: {
        connect: { id: patient_id }
      },
      health_unit: {
        connect: { id: health_unit_id }
      }
    };

    return this.prisma.medical_record.create({
      data,
      include: {
        patient: true,
        health_unit: true,
      },
    });
  }

  // Atualizar prontuário médico
  async updateMedicalRecord(id: string, dto: UpdateMedicalRecordDto) {
    const medicalRecord = await this.prisma.medical_record.findUnique({
      where: { id },
    });

    if (!medicalRecord) {
      throw new NotFoundException(`Prontuário com ID ${id} não encontrado`);
    }

    const { patient_id, health_unit_id, ...rest } = dto;
    
    const data: Prisma.medical_recordUpdateInput = {
      ...rest,
      ...(patient_id && {
        patient: {
          connect: { id: patient_id }
        }
      }),
      ...(health_unit_id && {
        health_unit: {
          connect: { id: health_unit_id }
        }
      })
    };

    return this.prisma.medical_record.update({
      where: { id },
      data,
      include: {
        patient: true,
        health_unit: true,
      },
    });
  }

  // Excluir prontuário médico
  async deleteMedicalRecord(id: string) {
    const medicalRecord = await this.prisma.medical_record.findUnique({
      where: { id },
    });

    if (!medicalRecord) {
      throw new NotFoundException(`Prontuário com ID ${id} não encontrado`);
    }

    return this.prisma.medical_record.delete({
      where: { id },
    });
  }

  // Listar todos os prontuários médicos
  async findAllMedicalRecords() {
    return this.prisma.medical_record.findMany({
      include: {
        patient: true,
        health_unit: true,
      },
    });
  }

  // Buscar consultas por ID do prontuário médico
  async findConsultationsByMedicalRecordId(medicalRecordId: string) {
    const consultations = await this.prisma.consultation.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        doctor: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return consultations;
  }

  // Buscar medicamentos por ID do prontuário médico
  async findMedicationsByMedicalRecordId(medicalRecordId: string) {
    const medications = await this.prisma.medication.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        doctor: true,
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    return medications;
  }

  // Buscar exames por ID do prontuário médico
  async findExamsByMedicalRecordId(medicalRecordId: string) {
    const exams = await this.prisma.exam.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        doctor: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return exams;
  }

  // Buscar documentos por ID do prontuário médico
  async findDocumentsByMedicalRecordId(medicalRecordId: string) {
    const documents = await this.prisma.document.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        uploader: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return documents;
  }

  // Endpoint agregador para o Resumo de Saúde dinâmico
  async getHealthSummary(medicalRecordId: string) {
    // Buscar o prontuário médico
    const medicalRecord = await this.prisma.medical_record.findUnique({
      where: { id: medicalRecordId },
      include: {
        patient: true,
        health_unit: true,
      },
    });

    if (!medicalRecord) {
      throw new Error('Prontuário médico não encontrado');
    }

    // Buscar medicamentos ativos
    const activeMedications = await this.prisma.medication.findMany({
      where: { 
        medical_record_id: medicalRecordId,
        status: 'active'
      },
      include: {
        doctor: true,
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    // Buscar consultas recentes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentConsultations = await this.prisma.consultation.findMany({
      where: { 
        medical_record_id: medicalRecordId,
        date: {
          gte: sixMonthsAgo
        }
      },
      include: {
        doctor: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });

    // Buscar exames recentes (últimos 6 meses)
    const recentExams = await this.prisma.exam.findMany({
      where: { 
        medical_record_id: medicalRecordId,
        date: {
          gte: sixMonthsAgo
        }
      },
      include: {
        doctor: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });

    // Buscar documentos recentes
    const recentDocuments = await this.prisma.document.findMany({
      where: { 
        medical_record_id: medicalRecordId,
      },
      include: {
        uploader: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });

    // Formatar o resumo de saúde
    const healthSummary = {
      patient: {
        name: medicalRecord.patient.name,
        birth_date: medicalRecord.patient.birth_date,
        gender: medicalRecord.patient.gender,
        blood_type: medicalRecord.blood_type,
        height: medicalRecord.height,
        weight: medicalRecord.weight,
      },
      allergies: medicalRecord.allergies || [],
      chronic_diseases: medicalRecord.chronic_diseases || [],
      summary: {
        active_medications_count: activeMedications.length,
        recent_consultations_count: recentConsultations.length,
        recent_exams_count: recentExams.length,
        recent_documents_count: recentDocuments.length,
      },
      recent_items: {
        medications: activeMedications.slice(0, 3).map(med => ({
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          status: med.status,
        })),
        consultations: recentConsultations.slice(0, 3).map(cons => ({
          id: cons.id,
          date: cons.date,
          reason: cons.reason,
          doctor_name: cons.doctor?.name,
        })),
        exams: recentExams.slice(0, 3).map(exam => ({
          id: exam.id,
          name: exam.name,
          date: exam.date,
          status: exam.status,
        })),
        documents: recentDocuments.slice(0, 3).map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          date: doc.date,
        })),
      }
    };
    
    return healthSummary;
  }

  // ========== MÉTODOS CRUD PARA CONSULTAS ==========
  async createConsultation(createConsultationDto: any) {
    const { medical_record_id, doctor_id, consultation_date, ...rest } = createConsultationDto;
    
    console.log('[MedicalRecordsService] Criando consulta com dados:', { medical_record_id, doctor_id, consultation_date, ...rest });
    
    try {
      const data: Prisma.consultationCreateInput = {
        doctor_name: rest.doctor_name || 'Não informado',
        specialty: rest.specialty || 'Geral',
        date: consultation_date ? new Date(consultation_date) : new Date(),
        reason: rest.reason,
        // Adicionando o campo diagnosis que estava faltando
        diagnosis: rest.diagnosis,
        // Mapeando observations do DTO para notes do schema
        notes: rest.observations,
        // Mapeando prescriptions do DTO para prescription do schema
        prescription: rest.prescriptions,
        status: rest.status as any || 'scheduled',
        medical_record: {
          connect: { id: medical_record_id }
        },
        ...(doctor_id && {
          doctor: {
            connect: { id: doctor_id }
          }
        })
      };
      
      console.log('[MedicalRecordsService] Dados mapeados para Prisma:', data);

      return this.prisma.consultation.create({
        data,
        include: {
          doctor: true,
          medical_record: true
        }
      });
    } catch (error) {
      console.error('[MedicalRecordsService] Erro ao criar consulta:', error);
      throw error;
    }
  }

  async updateConsultation(id: string, updateConsultationDto: any) {
    const { medical_record_id, doctor_id, consultation_date, ...rest } = updateConsultationDto;
    
    console.log('[MedicalRecordsService] Atualizando consulta com ID:', id, 'Dados:', { medical_record_id, doctor_id, consultation_date, ...rest });
    
    try {
      const data: Prisma.consultationUpdateInput = {
        ...(rest.doctor_name && { doctor_name: rest.doctor_name }),
        ...(rest.specialty && { specialty: rest.specialty }),
        ...(consultation_date && { date: new Date(consultation_date) }),
        ...(rest.reason && { reason: rest.reason }),
        // Adicionando o campo diagnosis que estava faltando
        ...(rest.diagnosis !== undefined && { diagnosis: rest.diagnosis }),
        // Mapeando observations do DTO para notes do schema
        ...(rest.observations !== undefined && { notes: rest.observations }),
        // Mapeando prescriptions do DTO para prescription do schema
        ...(rest.prescriptions !== undefined && { prescription: rest.prescriptions }),
        ...(rest.status && { status: rest.status as any }),
        ...(medical_record_id && {
          medical_record: {
            connect: { id: medical_record_id }
          }
        }),
        ...(doctor_id && {
          doctor: {
            connect: { id: doctor_id }
          }
        })
      };
      
      console.log('[MedicalRecordsService] Dados mapeados para Prisma:', data);

      return this.prisma.consultation.update({
        where: { id },
        data,
        include: {
          doctor: true,
          medical_record: true
        }
      });
    } catch (error) {
      console.error('[MedicalRecordsService] Erro ao atualizar consulta:', error);
      throw error;
    }
  }

  async deleteConsultation(id: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id }
    });

    if (!consultation) {
      throw new NotFoundException(`Consulta com ID ${id} não encontrada`);
    }

    return this.prisma.consultation.delete({
      where: { id }
    });
  }

  // ========== MÉTODOS CRUD PARA MEDICAMENTOS ==========
  async createMedication(createMedicationDto: CreateMedicationDto) {
    const { medical_record_id, doctor_id, ...rest } = createMedicationDto;
    
    const data: Prisma.medicationCreateInput = {
      ...rest,
      medical_record: {
        connect: { id: medical_record_id }
      },
      ...(doctor_id && {
        doctor: {
          connect: { id: doctor_id }
        }
      })
    };

    return this.prisma.medication.create({
      data,
      include: {
        doctor: true,
        medical_record: true
      }
    });
  }

  async updateMedication(id: string, updateMedicationDto: UpdateMedicationDto) {
    const medication = await this.prisma.medication.findUnique({
      where: { id }
    });

    if (!medication) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    const { medical_record_id, doctor_id, ...rest } = updateMedicationDto;
    
    const data: Prisma.medicationUpdateInput = {
      ...rest,
      ...(medical_record_id && {
        medical_record: {
          connect: { id: medical_record_id }
        }
      }),
      ...(doctor_id && {
        doctor: {
          connect: { id: doctor_id }
        }
      })
    };

    return this.prisma.medication.update({
      where: { id },
      data,
      include: {
        doctor: true,
        medical_record: true
      }
    });
  }

  async deleteMedication(id: string) {
    const medication = await this.prisma.medication.findUnique({
      where: { id }
    });

    if (!medication) {
      throw new NotFoundException(`Medicamento com ID ${id} não encontrado`);
    }

    return this.prisma.medication.delete({
      where: { id }
    });
  }

  // ========== MÉTODOS CRUD PARA EXAMES ==========
  async createExam(createExamDto: any) {
    const { medical_record_id, doctor_id, exam_date, ...rest } = createExamDto;
    
    const data: Prisma.examCreateInput = {
      name: rest.name,
      type: rest.type,
      date: exam_date ? new Date(exam_date) : new Date(),
      result: rest.result,
      observations: rest.observations,
      status: rest.status as any || 'pending',
      cost: rest.cost,
      location: rest.location,
      responsible_doctor: rest.responsible_doctor,
      medical_record: {
        connect: { id: medical_record_id }
      },
      ...(doctor_id && {
        doctor: {
          connect: { id: doctor_id }
        }
      })
    };

    return this.prisma.exam.create({
      data,
      include: {
        doctor: true,
        medical_record: true
      }
    });
  }

  async updateExam(id: string, updateExamDto: any) {
    const { medical_record_id, doctor_id, exam_date, ...rest } = updateExamDto;
    
    const data: Prisma.examUpdateInput = {
      ...(rest.name && { name: rest.name }),
      ...(rest.type && { type: rest.type }),
      ...(exam_date && { date: new Date(exam_date) }),
      ...(rest.result !== undefined && { result: rest.result }),
      ...(rest.observations !== undefined && { observations: rest.observations }),
      ...(rest.status && { status: rest.status as any }),
      ...(rest.cost !== undefined && { cost: rest.cost }),
      ...(rest.location !== undefined && { location: rest.location }),
      ...(rest.responsible_doctor !== undefined && { responsible_doctor: rest.responsible_doctor }),
      ...(medical_record_id && {
        medical_record: {
          connect: { id: medical_record_id }
        }
      }),
      ...(doctor_id && {
        doctor: {
          connect: { id: doctor_id }
        }
      })
    };

    return this.prisma.exam.update({
      where: { id },
      data,
      include: {
        doctor: true,
        medical_record: true
      }
    });
  }

  async deleteExam(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      throw new NotFoundException(`Exame com ID ${id} não encontrado`);
    }

    return this.prisma.exam.delete({
      where: { id }
    });
  }

  // ========== MÉTODOS CRUD PARA DOCUMENTOS ==========
  async createDocument(createDocumentDto: any) {
    const { medical_record_id, uploader_id, ...rest } = createDocumentDto;
    
    const data: Prisma.documentCreateInput = {
      name: rest.name,
      type: rest.type,
      file_path: rest.file_path || rest.file_url || '',
      file_size: rest.file_size,
      mime_type: rest.mime_type,
      description: rest.description,
      date: rest.date ? new Date(rest.date) : new Date(),
      status: rest.status || 'active',
      medical_record: {
        connect: { id: medical_record_id }
      },
      ...(uploader_id && {
        uploader: {
          connect: { id: uploader_id }
        }
      })
    };

    return this.prisma.document.create({
      data,
      include: {
        uploader: true,
        medical_record: true
      }
    });
  }

  async updateDocument(id: string, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado`);
    }

    const { medical_record_id, uploader_id, ...rest } = updateDocumentDto;
    
    const data: Prisma.documentUpdateInput = {
      ...rest,
      ...(medical_record_id && {
        medical_record: {
          connect: { id: medical_record_id }
        }
      }),
      ...(uploader_id && {
        uploader: {
          connect: { id: uploader_id }
        }
      })
    };

    return this.prisma.document.update({
      where: { id },
      data,
      include: {
        uploader: true,
        medical_record: true
      }
    });
  }

  async deleteDocument(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID ${id} não encontrado`);
    }

    return this.prisma.document.delete({
      where: { id }
    });
  }
}
