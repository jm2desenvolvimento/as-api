import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMasterPermissions() {
  try {
    console.log('🔄 Atualizando permissões do usuário MASTER...');
    
    // ID do usuário MASTER criado no seed
    const masterUserId = '550e8400-e29b-41d4-a716-446655440010';
    
    await prisma.user.update({
      where: { id: masterUserId },
      data: {
        allowed: {
          permission_create: true,
          user_list: true,
          user_create: true,
          user_edit: true,
          user_delete: true,
          user_view: true
        }
      }
    });
    
    console.log('✅ Permissões atualizadas com sucesso!');
    console.log('👑 Usuário MASTER agora tem todas as permissões necessárias:');
    console.log('   - permission_create: true');
    console.log('   - user_list: true');
    console.log('   - user_create: true');
    console.log('   - user_edit: true');
    console.log('   - user_delete: true');
    console.log('   - user_view: true');
  } catch (error) {
    console.error('❌ Erro ao atualizar permissões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMasterPermissions();
