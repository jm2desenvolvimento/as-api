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
            profile_addresses: true,
            profile_emails: true,
            user: {
              select: {
                id: true,
                email: true,
                cpf: true
              }
            }
          }
        },
        health_unit: true,
        // ✅ INCLUINDO: Consultas, medicamentos, exames e documentos
        consultations: {
          orderBy: { date: 'desc' }
        },
        medications: {
          orderBy: { start_date: 'desc' }
        },
        exams: {
          orderBy: { date: 'desc' }
        },
        documents: {
          orderBy: { date: 'desc' }
        }
      },
    });

    if (medicalRecord) {
      console.log(`✅ [ENCONTRADO] Prontuário encontrado diretamente com profile.id: ${medicalRecord.id}`);
      console.log(`🔍 [DEBUG] Patient data:`, medicalRecord.patient);
      console.log(`🔍 [DEBUG] Patient user data:`, medicalRecord.patient?.user);
      console.log(`🔍 [DEBUG] Patient profile emails:`, medicalRecord.patient?.profile_emails);
      console.log(`🔍 [DEBUG] Patient user_id:`, medicalRecord.patient?.user_id);
      console.log(`🔍 [DEBUG] Email mapping:`, {
        userEmail: medicalRecord.patient?.user?.email,
        profileEmails: medicalRecord.patient?.profile_emails,
        firstProfileEmail: medicalRecord.patient?.profile_emails?.[0]?.email,
        user_id: medicalRecord.patient?.user_id
      });
      console.log(`🔍 [DEBUG] Consultas encontradas: ${medicalRecord.consultations?.length || 0}`);
      console.log(`🔍 [DEBUG] Medicamentos encontrados: ${medicalRecord.medications?.length || 0}`);
      console.log(`🔍 [DEBUG] Exames encontrados: ${medicalRecord.exams?.length || 0}`);
      console.log(`🔍 [DEBUG] Documentos encontrados: ${medicalRecord.documents?.length || 0}`);
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
              profile_addresses: true,
              profile_emails: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  cpf: true
                }
              }
            }
          },
          health_unit: true,
          // ✅ INCLUINDO: Consultas, medicamentos, exames e documentos
          consultations: {
            orderBy: { date: 'desc' }
          },
          medications: {
            orderBy: { start_date: 'desc' }
          },
          exams: {
            orderBy: { date: 'desc' }
          },
          documents: {
            orderBy: { date: 'desc' }
          }
        },
      });

      if (medicalRecord) {
        console.log(`✅ [ENCONTRADO] Prontuário encontrado com profile.id derivado: ${medicalRecord.id}`);
        console.log(`🔍 [DEBUG] Patient data:`, medicalRecord.patient);
        console.log(`🔍 [DEBUG] Patient user data:`, medicalRecord.patient?.user);
        console.log(`🔍 [DEBUG] Patient profile emails:`, medicalRecord.patient?.profile_emails);
        console.log(`🔍 [DEBUG] Patient user_id:`, medicalRecord.patient?.user_id);
        console.log(`🔍 [DEBUG] Email mapping:`, {
          userEmail: medicalRecord.patient?.user?.email,
          profileEmails: medicalRecord.patient?.profile_emails,
          firstProfileEmail: medicalRecord.patient?.profile_emails?.[0]?.email,
          user_id: medicalRecord.patient?.user_id
        });
        console.log(`🔍 [DEBUG] Consultas encontradas: ${medicalRecord.consultations?.length || 0}`);
        console.log(`🔍 [DEBUG] Medicamentos encontrados: ${medicalRecord.medications?.length || 0}`);
        console.log(`🔍 [DEBUG] Exames encontrados: ${medicalRecord.exams?.length || 0}`);
        console.log(`🔍 [DEBUG] Documentos encontrados: ${medicalRecord.documents?.length || 0}`);
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
        profile_emails: true,
        user: {
          select: {
            id: true,
            email: true,
            cpf: true
          }
        }
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
          profile_emails: true,
          user: {
            select: {
              id: true,
              email: true,
              cpf: true
            }
          }
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
            profile_addresses: true,
            profile_emails: true,
            user: {
              select: {
                id: true,
                email: true,
                cpf: true
              }
            }
          }
        },
        health_unit: true,
        // Garantir que a tipagem inclua as relações esperadas logo após a criação
        consultations: true,
        medications: true,
        exams: true,
        documents: true,
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
        patient: {
          include: {
            profile_phones: true,
            profile_addresses: true,
            profile_emails: true,
            user: {
              select: {
                id: true,
                email: true,
                cpf: true
              }
            }
          }
        },
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
        patient: {
          include: {
            profile_phones: true,
            profile_addresses: true,
            profile_emails: true,
            user: {
              select: {
                id: true,
                email: true,
                cpf: true
              }
            }
          }
        },
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
        patient: {
          include: {
            profile_phones: true,
            profile_addresses: true,
            profile_emails: true,
            user: {
              select: {
                id: true,
                email: true,
                cpf: true
              }
            }
          }
        },
        health_unit: true,
      },
    });
  }

  // Buscar consultas por ID do prontuário médico
  async findConsultationsByMedicalRecordId(medicalRecordId: string) {
    const consultations = await this.prisma.consultation.findMany({
      where: { medical_record_id: medicalRecordId },
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
          doctor_name: cons.doctor_name || 'Médico não informado',
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
        // ✅ Mapeamento correto: observations → notes, prescriptions → prescription
        notes: rest.observations,
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
        // ✅ Mapeamento correto: observations → notes, prescriptions → prescription
        ...(rest.observations !== undefined && { notes: rest.observations }),
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
    const { medical_record_id, doctor_id, date, ...rest } = createExamDto;
    
    // ✅ DEBUG: Verificar dados recebidos
    console.log('[MedicalRecordsService] createExam - Dados recebidos:', {
      medical_record_id,
      doctor_id,
      date,
      rest
    });
    
    // Buscar o nome do médico se doctor_id for fornecido
    let doctorName = rest.doctor_name;
    if (doctor_id && !doctorName) {
      try {
        const doctor = await this.prisma.user.findUnique({
          where: { id: doctor_id },
          select: { profile: { select: { name: true } } }
        });
        doctorName = doctor?.profile?.name || 'Médico';
        console.log('[MedicalRecordsService] Nome do médico encontrado:', doctorName);
      } catch (error) {
        doctorName = 'Médico';
        console.log('[MedicalRecordsService] Erro ao buscar médico, usando padrão:', error);
      }
    }
    
    const data: Prisma.examCreateInput = {
      name: rest.name,
      type: rest.type,
      date: date ? new Date(date) : new Date(), // ✅ Corrigido: usa 'date'
      results: rest.results, // ✅ Corrigido: usa 'results'
      lab: rest.lab, // ✅ Adicionado: campo lab
      doctor_name: doctorName || 'Médico', // ✅ Sempre preenchido
      file_url: rest.file_url, // ✅ Adicionado: campo file_url
      status: rest.status as any || 'pending',
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
    const { medical_record_id, doctor_id, date, ...rest } = updateExamDto;
    
    // Buscar o nome do médico se doctor_id for fornecido
    let doctorName = rest.doctor_name;
    if (doctor_id && !doctorName) {
      try {
        const doctor = await this.prisma.user.findUnique({
          where: { id: doctor_id },
          select: { profile: { select: { name: true } } }
        });
        doctorName = doctor?.profile?.name || 'Médico';
      } catch (error) {
        doctorName = 'Médico';
      }
    }
    
    const data: Prisma.examUpdateInput = {
      ...(rest.name && { name: rest.name }),
      ...(rest.type && { type: rest.type }),
      ...(date && { date: new Date(date) }), // ✅ Corrigido: usa 'date'
      ...(rest.results !== undefined && { results: rest.results }), // ✅ Corrigido: usa 'results'
      ...(rest.lab !== undefined && { lab: rest.lab }), // ✅ Adicionado: campo lab
      ...(rest.doctor_name !== undefined && { doctor_name: rest.doctor_name }), // ✅ Corrigido: usa 'doctor_name'
      ...(rest.file_url !== undefined && { file_url: rest.file_url }), // ✅ Adicionado: campo file_url
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
    
    // Sempre atualizar o doctor_name se disponível
    if (doctorName) {
      data.doctor_name = doctorName;
    }

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
      file_url: rest.file_url || '',

      description: rest.description,
      date: rest.date ? new Date(rest.date) : new Date(),

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
