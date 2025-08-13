import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearPermissions(): Promise<void> {
  console.log('🧹 Iniciando limpeza das permissões...');
  
  try {
    // 1. Remover todas as associações role_permission
    console.log('🔄 Removendo associações role-permission...');
    await prisma.role_permission.deleteMany();
    console.log('✅ Associações role-permission removidas');
    
    // 2. Remover todas as permissões
    console.log('🔄 Removendo todas as permissões...');
    await prisma.permission.deleteMany();
    console.log('✅ Todas as permissões removidas');
    
    console.log('🎉 Limpeza concluída com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Reinicie o backend');
    console.log('2. Faça login como MASTER');
    console.log('3. Acesse a interface de Permissões');
    console.log('4. Recrie as permissões manualmente como estava antes');
    console.log('');
    console.log('⚠️  IMPORTANTE: NÃO execute o script sync-rbac.ts novamente!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearPermissions();
