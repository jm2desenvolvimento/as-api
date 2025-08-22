import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar banco existente
  console.log('🧹 Limpando banco de dados...');
  await prisma.consultation.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.document.deleteMany();
  await prisma.medical_record.deleteMany();
  await prisma.medical_schedule.deleteMany();
  await prisma.profile_doctor.deleteMany();
  await prisma.profile_address.deleteMany();
  await prisma.profile_email.deleteMany();
  await prisma.profile_phone.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.role_permission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.health_unit.deleteMany();
  await prisma.city_hall.deleteMany();

  console.log('✅ Banco limpo com sucesso!');

  // IDs fixos para relacionamentos
  const cityHallId = '550e8400-e29b-41d4-a716-446655440001';
  const healthUnitId = '550e8400-e29b-41d4-a716-446655440002';

  // 1. MASTER USER (sem vínculos territoriais)
  console.log('👑 Criando usuário MASTER...');
  const masterUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      email: 'master@agendasaude.com',
      password: await bcrypt.hash('Master@123', 10),
      cpf: '11111111111',
      role: UserRole.MASTER,
      is_active: true,
      allowed: {},
      profile: {
        create: {
          id: '550e8400-e29b-41d4-a716-446655440011',
          name: 'Master User',
          birth_date: new Date('1980-01-01'),
          gender: 'M',
          document_type: 'CPF',
          sus_card: '123456789012345',
          avatar_url: null,
          profile_phones: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440012',
              phone: '11999999999',
              phone_type: 'mobile',
              is_primary: true
            }
          },
          profile_emails: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440013',
              email: 'master@agendasaude.com',
              is_primary: true
            }
          },
          profile_addresses: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440014',
              address: 'Rua Master, 123',
              number: '123',
              complement: 'Apto 1',
              district: 'Centro',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '01234-567',
              address_type: 'residential',
              is_primary: true
            }
          }
        }
      }
    }
  });

  // 2. ADMIN USER (vinculado à prefeitura e UBS)
  console.log('👨‍💼 Criando usuário ADMIN...');
  const adminUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440020',
      email: 'admin@agendasaude.com',
      password: await bcrypt.hash('Admin@123', 10),
      cpf: '22222222222',
      role: UserRole.ADMIN,
      is_active: true,
      city_id: cityHallId,
      health_unit_id: healthUnitId,
      allowed: {},
      profile: {
        create: {
          id: '550e8400-e29b-41d4-a716-446655440021',
          name: 'Admin User',
          birth_date: new Date('1985-05-15'),
          gender: 'M',
          document_type: 'CPF',
          sus_card: '234567890123456',
          avatar_url: null,
          profile_phones: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440022',
              phone: '11888888888',
              phone_type: 'mobile',
              is_primary: true
            }
          },
          profile_emails: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440023',
              email: 'admin@agendasaude.com',
              is_primary: true
            }
          },
          profile_addresses: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440024',
              address: 'Rua Admin, 456',
              number: '456',
              complement: 'Sala 2',
              district: 'Vila Admin',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '04567-890',
              address_type: 'residential',
              is_primary: true
            }
          }
        }
      }
    }
  });

  // 3. DOCTOR USER (mesma UBS do ADMIN)
  console.log('👨‍⚕️ Criando usuário DOCTOR...');
  const doctorUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440030',
      email: 'doctor@agendasaude.com',
      password: await bcrypt.hash('Doctor@123', 10),
      cpf: '33333333333',
      role: UserRole.DOCTOR,
      is_active: true,
      city_id: cityHallId,
      health_unit_id: healthUnitId,
      allowed: {},
      profile: {
        create: {
          id: '550e8400-e29b-41d4-a716-446655440031',
          name: 'Dr. João Silva',
          birth_date: new Date('1988-08-20'),
          gender: 'M',
          document_type: 'CPF',
          sus_card: '345678901234567',
          avatar_url: null,
          profile_phones: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440032',
              phone: '11777777777',
              phone_type: 'mobile',
              is_primary: true
            }
          },
          profile_emails: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440033',
              email: 'doctor@agendasaude.com',
              is_primary: true
            }
          },
          profile_addresses: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440034',
              address: 'Rua Doctor, 789',
              number: '789',
              complement: 'Apto 3',
              district: 'Vila Doctor',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '05678-901',
              address_type: 'residential',
              is_primary: true
            }
          },
          profile_doctor: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440035',
              crm_number: '12345',
              crm_uf: 'SP',
              specialty: 'Clínico Geral'
            }
          }
        }
      }
    }
  });

  // 4. PATIENT USER (mesma UBS do ADMIN)
  console.log('👤 Criando usuário PATIENT...');
  const patientUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440040',
      email: 'patient@agendasaude.com',
      password: await bcrypt.hash('Patient@123', 10),
      cpf: '44444444444',
      role: UserRole.PATIENT,
      is_active: true,
      city_id: cityHallId,
      health_unit_id: healthUnitId,
      allowed: {},
      profile: {
        create: {
          id: '550e8400-e29b-41d4-a716-446655440041',
          name: 'Maria Santos',
          birth_date: new Date('1990-12-10'),
          gender: 'F',
          document_type: 'CPF',
          sus_card: '456789012345678',
          avatar_url: null,
          profile_phones: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440042',
              phone: '11666666666',
              phone_type: 'mobile',
              is_primary: true
            }
          },
          profile_emails: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440043',
              email: 'patient@agendasaude.com',
              is_primary: true
            }
          },
          profile_addresses: {
            create: {
              id: '550e8400-e29b-41d4-a716-446655440044',
              address: 'Rua Patient, 101',
              number: '101',
              complement: 'Apto 4',
              district: 'Vila Patient',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '06789-012',
              address_type: 'residential',
              is_primary: true
            }
          }
        }
      }
    }
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📋 RESUMO DOS USUÁRIOS CRIADOS:');
  console.log('👑 MASTER:', masterUser.email, '(sem vínculos territoriais)');
  console.log('👨‍💼 ADMIN:', adminUser.email, `(city_id: ${cityHallId}, health_unit_id: ${healthUnitId})`);
  console.log('👨‍⚕️ DOCTOR:', doctorUser.email, `(city_id: ${cityHallId}, health_unit_id: ${healthUnitId})`);
  console.log('👤 PATIENT:', patientUser.email, `(city_id: ${cityHallId}, health_unit_id: ${healthUnitId})`);
  console.log('\n🔗 IDs para referência:');
  console.log('🏛️  City Hall ID:', cityHallId);
  console.log('🏥 Health Unit ID:', healthUnitId);
  console.log('\n⚠️  PRÓXIMOS PASSOS:');
  console.log('1. Cadastrar city_hall com ID:', cityHallId);
  console.log('2. Cadastrar health_unit com ID:', healthUnitId);
  console.log('3. Adicionar permissões conforme necessário');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
