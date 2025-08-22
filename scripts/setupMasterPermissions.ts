import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupMasterPermissions() {
  try {
    console.log('🔄 Configurando permissões do usuário MASTER...');
    
    // 1. Criar permissões básicas
    console.log('📝 Criando permissões básicas...');
    
    const permissions = [
      { id: '550e8400-e29b-41d4-a716-446655440030', name: 'user_list', description: 'Listar usuários', resource: 'user', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440031', name: 'user_create', description: 'Criar usuários', resource: 'user', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440032', name: 'user_edit', description: 'Editar usuários', resource: 'user', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440033', name: 'user_delete', description: 'Excluir usuários', resource: 'user', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440034', name: 'user_view', description: 'Visualizar usuários', resource: 'user', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440035', name: 'permission_create', description: 'Criar permissões', resource: 'permission', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440036', name: 'permission_edit', description: 'Editar permissões', resource: 'permission', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440037', name: 'permission_delete', description: 'Excluir permissões', resource: 'permission', is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440038', name: 'permission_view', description: 'Visualizar permissões', resource: 'permission', is_active: true }
    ];

    for (const perm of permissions) {
      await prisma.permission.upsert({
        where: { id: perm.id },
        update: perm,
        create: perm
      });
    }
    
    console.log('✅ Permissões criadas/atualizadas!');
    
    // 2. Vincular permissões ao role MASTER
    console.log('🔗 Vinculando permissões ao role MASTER...');
    
    for (const perm of permissions) {
      // Verificar se já existe
      const existing = await prisma.role_permission.findFirst({
        where: {
          role: 'MASTER',
          permission_id: perm.id
        }
      });
      
      if (!existing) {
        await prisma.role_permission.create({
          data: {
            id: `550e8400-e29b-41d4-a716-4466554400${perm.id.slice(-2)}`,
            role: 'MASTER',
            permission_id: perm.id
          }
        });
        console.log(`✅ Permissão ${perm.name} vinculada ao MASTER`);
      } else {
        console.log(`ℹ️ Permissão ${perm.name} já está vinculada ao MASTER`);
      }
    }
    
    console.log('✅ Permissões vinculadas ao role MASTER!');
    
    // 3. Limpar campo allowed do usuário MASTER (não é mais necessário)
    console.log('🧹 Limpando campo allowed do usuário MASTER...');
    
    const masterUserId = '550e8400-e29b-41d4-a716-446655440010';
    await prisma.user.update({
      where: { id: masterUserId },
      data: { allowed: {} }
    });
    
    console.log('✅ Campo allowed limpo!');
    console.log('👑 Usuário MASTER agora tem permissões via role_permission!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar permissões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMasterPermissions();
