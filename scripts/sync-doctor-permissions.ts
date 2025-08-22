import { PrismaClient } from '@prisma/client';
import { DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS } from '../src/modules/auth/constants/permissions';

const prisma = new PrismaClient();

async function syncDoctorPermissions(): Promise<void> {
  console.log('🔄 Sincronizando permissões do role DOCTOR...');
  
  try {
    // 1. Sincronizar todas as permissões primeiro
    console.log('📋 Sincronizando permissões...');
    for (const permissionName of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: { 
          description: getPermissionDescription(permissionName),
          is_active: true 
        },
        create: {
          name: permissionName,
          description: getPermissionDescription(permissionName),
          is_active: true,
        },
      });
    }
    console.log(`✅ ${ALL_PERMISSIONS.length} permissões sincronizadas`);
    
    // 2. Sincronizar permissões específicas do role DOCTOR
    console.log('👨‍⚕️ Sincronizando permissões do role DOCTOR...');
    const doctorPermissions = DEFAULT_ROLE_PERMISSIONS.DOCTOR;
    
    // Limpar permissões existentes para o role DOCTOR
    await prisma.role_permission.deleteMany({ 
      where: { role: 'DOCTOR' } 
    });
    console.log('🗑️ Permissões antigas do DOCTOR removidas');
    
    // Adicionar novas permissões
    for (const permissionName of doctorPermissions) {
      const permission = await prisma.permission.findUnique({ 
        where: { name: permissionName } 
      });
      
      if (permission) {
        await prisma.role_permission.create({
          data: {
            role: 'DOCTOR',
            permission_id: permission.id,
          },
        });
        console.log(`✅ Permissão ${permissionName} adicionada ao role DOCTOR`);
      } else {
        console.log(`❌ Permissão ${permissionName} não encontrada`);
      }
    }
    
    console.log(`✅ Role DOCTOR: ${doctorPermissions.length} permissões configuradas`);
    
    // 3. Verificar usuários DOCTOR existentes
    console.log('👥 Verificando usuários DOCTOR existentes...');
    const doctorUsers = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, email: true }
    });
    
    console.log(`📊 Encontrados ${doctorUsers.length} usuários DOCTOR:`);
    for (const user of doctorUsers) {
      console.log(`   - ${user.email} (${user.id})`);
    }
    
    console.log('🎯 Sincronização concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    // Dashboard
    'dashboard_view': 'Visualizar dashboard',
    'dashboard_stats': 'Ver estatísticas do dashboard',
    'dashboard_doctor_view': 'Visualizar dashboard do médico',
    
    // Agendamentos
    'appointment_view': 'Visualizar agendamentos',
    'appointment_update': 'Atualizar agendamentos',
    'appointment_list': 'Listar agendamentos',
    
    // Pacientes
    'patient_view': 'Visualizar pacientes',
    'patient_list': 'Listar pacientes',
    
    // Prontuários médicos
    'medical_record_create': 'Criar prontuários médicos',
    'medical_record_view': 'Visualizar prontuários médicos',
    'medical_record_update': 'Editar prontuários médicos',
    'medical_record_list': 'Listar prontuários médicos',
    
    // Agenda médica
    'medical_schedule_view': 'Visualizar agenda médica',
    'medical_schedule_update': 'Atualizar agenda médica',
    'medical_schedule_list': 'Listar agenda médica',
    
    // Perfis
    'profile_view': 'Visualizar perfis',
    'profile_update': 'Atualizar perfis',
    
    // Configurações
    'config_view': 'Visualizar configurações',
  };
  
  return descriptions[permission] || `Permissão: ${permission}`;
}

// Executar a sincronização
syncDoctorPermissions()
  .then(() => {
    console.log('🎉 Sincronização concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na sincronização:', error);
    process.exit(1);
  });

