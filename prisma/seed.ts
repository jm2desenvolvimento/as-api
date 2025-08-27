import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados para produção...');

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

  // 1. USUÁRIO MASTER (apenas campos essenciais)
  console.log('👑 Criando usuário MASTER para produção...');
  const masterUser = await prisma.user.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      email: 'master@agendasaude.com',
      password: await bcrypt.hash('Master@123', 10),
      cpf: '00000000000',
      role: UserRole.MASTER,
      is_active: true,
      allowed: {},
      profile: {
        create: {
          id: '550e8400-e29b-41d4-a716-446655440011',
          name: 'Master User',
          avatar_url: null
        }
      }
    }
  });

  console.log('✅ Seed de produção concluído com sucesso!');
  console.log('\n📋 RESUMO:');
  console.log('👑 USUÁRIO MASTER criado:', masterUser.email);
  console.log('🔑 Senha padrão: Master@123');
  console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
  console.log('\n🚀 Sistema pronto para uso em produção!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
