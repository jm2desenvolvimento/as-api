import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Gerar hash das senhas
  const masterPassword = await bcrypt.hash('Master@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const patientPassword = await bcrypt.hash('Patient@123', 10);

  // Usuário MASTER
  await prisma.user.upsert({
    where: { email: 'master@agendasaude.com' },
    update: { password: masterPassword },
    create: {
      email: 'master@agendasaude.com',
      password: masterPassword,
      cpf: '11111111111',
      is_active: true,
      role: 'MASTER',
      allowed: [],
      profile: {
        create: {
          name: 'Master User',
          birth_date: new Date('1980-01-01'),
          gender: 'MALE',
          document_type: 'CPF',
          avatar_url: null,
          sus_card: null,
          profile_phones: {
            create: [{ phone: '11999999999', phone_type: 'MOBILE', is_primary: true }],
          },
          profile_emails: {
            create: [{ email: 'master@agendasaude.com', is_primary: true }],
          },
          profile_addresses: {
            create: [{
              address: 'Rua Central, 100',
              address_type: 'RESIDENTIAL',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '01000-000',
              is_primary: true,
              district: 'Centro',
              number: '100',
            }],
          },
        },
      },
    },
  });

  // Usuário ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@agendasaude.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@agendasaude.com',
      password: adminPassword,
      cpf: '22222222222',
      is_active: true,
      role: 'ADMIN',
      allowed: {} as any,
      profile: {
        create: {
          name: 'Admin User',
          birth_date: new Date('1985-02-02'),
          gender: 'FEMALE',
          document_type: 'CPF',
          avatar_url: null,
          sus_card: null,
          profile_phones: {
            create: [{ phone: '11988888888', phone_type: 'MOBILE', is_primary: true }],
          },
          profile_emails: {
            create: [{ email: 'admin@agendasaude.com', is_primary: true }],
          },
          profile_addresses: {
            create: [{
              address: 'Av. Paulista, 200',
              address_type: 'RESIDENTIAL',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '01310-000',
              is_primary: true,
              district: 'Paulista',
              number: '200',
            }],
          },
        },
      },
    },
  });

  // Usuário DOCTOR
  await prisma.user.upsert({
    where: { email: 'doctor@agendasaude.com' },
    update: { password: doctorPassword },
    create: {
      email: 'doctor@agendasaude.com',
      password: doctorPassword,
      cpf: '33333333333',
      is_active: true,
      role: 'DOCTOR',
      allowed: {} as any,
      profile: {
        create: {
          name: 'Dr. João Silva',
          birth_date: new Date('1975-03-03'),
          gender: 'MALE',
          document_type: 'CPF',
          avatar_url: null,
          sus_card: '123456789012345',
          profile_phones: {
            create: [{ phone: '11977777777', phone_type: 'MOBILE', is_primary: true }],
          },
          profile_emails: {
            create: [{ email: 'doctor@agendasaude.com', is_primary: true }],
          },
          profile_addresses: {
            create: [{
              address: 'Rua da Saúde, 300',
              address_type: 'RESIDENTIAL',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '04000-000',
              is_primary: true,
              district: 'Saúde',
              number: '300',
            }],
          },
          profile_doctor: {
            create: {
              crm_number: '123456',
              crm_uf: 'SP',
              specialty: 'Clínico Geral',
            },
          },
        },
      },
    },
  });

  // Usuário PATIENT
  await prisma.user.upsert({
    where: { email: 'patient@agendasaude.com' },
    update: { password: patientPassword },
    create: {
      email: 'patient@agendasaude.com',
      password: patientPassword,
      cpf: '44444444444',
      is_active: true,
      role: 'PATIENT',
      allowed: {} as any,
      profile: {
        create: {
          name: 'Maria Oliveira',
          birth_date: new Date('1990-04-04'),
          gender: 'FEMALE',
          document_type: 'CPF',
          avatar_url: null,
          sus_card: '987654321098765',
          profile_phones: {
            create: [{ phone: '11966666666', phone_type: 'MOBILE', is_primary: true }],
          },
          profile_emails: {
            create: [{ email: 'patient@agendasaude.com', is_primary: true }],
          },
          profile_addresses: {
            create: [{
              address: 'Rua das Flores, 400',
              address_type: 'RESIDENTIAL',
              city: 'São Paulo',
              state: 'SP',
              zip_code: '05000-000',
              is_primary: true,
              district: 'Jardim',
              number: '400',
            }],
          },
        },
      },
    },
  });

  console.log('Usuários criados/atualizados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 