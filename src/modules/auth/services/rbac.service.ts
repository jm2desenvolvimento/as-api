import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { 
  PERMISSIONS, 
  ALL_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS,
  Permission,
  RoleType,
  UserRole
} from '../constants/permissions';

const prisma = new PrismaClient();

@Injectable()
export class RbacService {
  
  /**
   * Sincronizar todas as permissões no banco de dados
   */
  async syncPermissions(): Promise<void> {
    console.log('🔄 Sincronizando permissões...');
    
    for (const permission of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: permission },
        update: { is_active: true },
        create: {
          name: permission,
          description: this.getPermissionDescription(permission),
          resource: this.extractResource(permission),
          action: this.extractAction(permission),
          is_active: true,
        },
      });
    }
    
    console.log(`✅ ${ALL_PERMISSIONS.length} permissões sincronizadas`);
  }

  /**
   * Sincronizar permissões de roles (agora usando enum)
   */
  async syncRoles(): Promise<void> {
    console.log('🔄 Sincronizando roles...');
    console.log('✅ Roles são agora enum - nada para sincronizar');
  }

  /**
   * Atribuir permissões padrão para cada role (agora usando enum)
   */
  async syncRolePermissions(): Promise<void> {
    console.log('🔄 Sincronizando permissões de roles...');
    
    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      // Limpar permissões existentes deste role
      await prisma.role_permission.deleteMany({ where: { role: roleName as UserRole } });
      
      // Adicionar novas permissões
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({ 
          where: { name: permissionName } 
        });
        
        if (permission) {
          await prisma.role_permission.create({
            data: {
              role: roleName as UserRole,
              permission_id: permission.id,
            },
          });
        }
      }
    }
    
    console.log('✅ Permissões de roles sincronizadas');
  }

  /**
   * Obter todas as permissões de um usuário (role + customizações JSON no campo allowed)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return [];

    // 1. Obter permissões padrão do role
    const rolePermissions = await prisma.role_permission.findMany({
      where: { role: user.role as UserRole },
      include: { permission: true }
    });

    const rolePermissionNames = rolePermissions.map(rp => rp.permission.name);
    
    // 2. Obter customizações específicas do usuário (campo allowed como JSON)
    const customizations = (user.allowed as any) || {};

    // 3. Aplicar lógica: role permissions - removidas + adicionadas
    let finalPermissions = [...rolePermissionNames];
    
    // Remover permissões que estão como false
    finalPermissions = finalPermissions.filter(permission => 
      customizations[permission] !== false
    );
    
    // Adicionar permissões que estão como true (e não estavam no role)
    Object.entries(customizations).forEach(([permission, granted]) => {
      if (granted === true && !finalPermissions.includes(permission)) {
        finalPermissions.push(permission);
      }
    });

    return finalPermissions;
  }

  /**
   * Verificar se usuário tem uma permissão específica
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const normalizedPermissions = permissions.map(p => this.normalizePermission(p));
    const normalizedPermission = this.normalizePermission(permission);
    return normalizedPermissions.includes(normalizedPermission);
  }

  /**
   * Verificar se um usuário tem todas as permissões necessárias
   */
  async hasPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    
    // Verificar se o usuário tem todas as permissões necessárias
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Normaliza uma permissão removendo apenas espaços extras
   * IMPORTANTE: Todas as permissões no sistema já usam underscore, não converter formatos
   */
  private normalizePermission(permission: string): string {
    // Apenas remover espaços extras - não converter formatos
    const trimmed = permission.trim();
    
    // Log para debug
    console.log(`[RBAC] Normalizando permissão: "${permission}" => "${trimmed}"`);
    
    return trimmed;
  }

  /**
   * Conceder permissão específica a um usuário (marca como true no JSON allowed)
   */
  async grantPermissionToUser(userId: string, permissionName: string): Promise<void> {
    // Verificar se a permissão existe
    const permission = await prisma.permission.findUnique({ 
      where: { name: permissionName } 
    });
    
    if (!permission) {
      throw new Error(`Permissão '${permissionName}' não encontrada`);
    }

    // Obter usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`Usuário não encontrado`);
    }

    // Atualizar campo allowed (JSON) para marcar permissão como true
    const currentAllowed = (user.allowed as any) || {};
    const updatedAllowed = {
      ...currentAllowed,
      [permissionName]: true
    };
    
    await prisma.user.update({
      where: { id: userId },
      data: { allowed: updatedAllowed }
    });
  }

  /**
   * Revogar permissão específica de um usuário (marca como false no JSON allowed)
   */
  async revokePermissionFromUser(userId: string, permissionName: string): Promise<void> {
    // Verificar se a permissão existe
    const permission = await prisma.permission.findUnique({ 
      where: { name: permissionName } 
    });
    
    if (!permission) {
      throw new Error(`Permissão '${permissionName}' não encontrada`);
    }

    // Obter usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`Usuário não encontrado`);
    }

    // Atualizar campo allowed (JSON) para marcar permissão como false
    const currentAllowed = (user.allowed as any) || {};
    const updatedAllowed = {
      ...currentAllowed,
      [permissionName]: false
    };
    
    await prisma.user.update({
      where: { id: userId },
      data: { allowed: updatedAllowed }
    });
  }

  /**
   * Executar sincronização completa do RBAC
   */
  async fullSync(): Promise<void> {
    console.log('🚀 Iniciando sincronização completa do RBAC...');
    
    await this.syncPermissions();
    await this.syncRoles();
    await this.syncRolePermissions();
    
    console.log('✅ Sincronização completa finalizada!');
  }

  /**
   * Obter todas as permissões disponíveis
   */
  async getAllPermissions(): Promise<any[]> {
    return await prisma.permission.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Obter permissões de um role específico
   */
  async getRolePermissions(role: UserRole): Promise<string[]> {
    const rolePermissions = await prisma.role_permission.findMany({
      where: { role },
      include: { permission: true }
    });
    return rolePermissions.map(rp => rp.permission.name);
  }

  /**
   * Atualizar permissões de um role
   */
  async updateRolePermissions(role: UserRole, permissions: string[]): Promise<void> {
    // Remover todas as permissões existentes do role
    await prisma.role_permission.deleteMany({ where: { role } });
    
    // Adicionar as novas permissões
    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({ 
        where: { name: permissionName } 
      });
      
      if (permission) {
        await prisma.role_permission.create({
          data: {
            role,
            permission_id: permission.id,
          },
        });
      }
    }
  }

  /**
   * Obter todos os usuários com suas permissões
   */
  async getAllUsersWithPermissions(): Promise<any[]> {
    const users = await prisma.user.findMany({
      where: { is_active: true },
      include: {
        profile: true
      },
      orderBy: { email: 'asc' }
    });

    // Para cada usuário, calcular suas permissões totais
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await this.getUserPermissions(user.id);
        return {
          id: user.id,
          email: user.email,
          cpf: user.cpf,
          role: user.role,
          profile: user.profile,
          permissions,
          specificPermissions: (user.allowed as any) || {} // Customizações de permissões no campo allowed (JSON)
        };
      })
    );

    return usersWithPermissions;
  }

  /**
   * Atualizar permissões específicas de um usuário (substitui objeto JSON allowed)
   */
  async updateUserSpecificPermissions(userId: string, permissionCustomizations: Record<string, boolean>): Promise<void> {
    // Verificar se todas as permissões existem
    for (const permissionName of Object.keys(permissionCustomizations)) {
      const permission = await prisma.permission.findUnique({ 
        where: { name: permissionName } 
      });
      
      if (!permission) {
        throw new Error(`Permissão '${permissionName}' não encontrada`);
      }
    }

    // Atualizar campo allowed com as novas customizações
    await prisma.user.update({
      where: { id: userId },
      data: { allowed: permissionCustomizations }
    });
  }

  /**
   * Remover customização específica de permissão (volta ao padrão do role)
   */
  async removePermissionCustomization(userId: string, permissionName: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`Usuário não encontrado`);
    }

    // Remover a customização específica do JSON
    const currentAllowed = (user.allowed as any) || {};
    const { [permissionName]: removed, ...updatedAllowed } = currentAllowed;
    
    await prisma.user.update({
      where: { id: userId },
      data: { allowed: updatedAllowed }
    });
  }

  // === MÉTODOS AUXILIARES ===

  private getPermissionDescription(permission: string): string {
    const descriptions: Record<string, string> = {
      // Usuários
      user_create: 'Criar novos usuários',
      user_view: 'Visualizar dados de usuários',
      user_update: 'Atualizar dados de usuários',
      user_delete: 'Excluir usuários',
      user_list: 'Listar usuários',
      
      // Dashboard
      dashboard_view: 'Acessar dashboard',
      dashboard_stats: 'Visualizar estatísticas',
      dashboard_reports: 'Acessar relatórios do dashboard',
      
      // Agendamentos
      appointment_create: 'Criar agendamentos',
      appointment_view: 'Visualizar agendamentos',
      appointment_update: 'Atualizar agendamentos',
      appointment_delete: 'Excluir agendamentos',
      appointment_list: 'Listar agendamentos',
      appointment_cancel: 'Cancelar agendamentos',
      appointment_reschedule: 'Reagendar agendamentos',
      
      // Default
    };
    
    return descriptions[permission] || `Permissão: ${permission}`;
  }

  private extractResource(permission: string): string {
    const parts = permission.split('_');
    return parts.length > 1 ? parts[0] : 'system';
  }

  private extractAction(permission: string): string {
    const parts = permission.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : permission;
  }
} 