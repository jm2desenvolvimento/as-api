import { Controller, Post, Get, Body, Param, UseGuards, Put, Request } from '@nestjs/common';
import { RbacService } from '../services/rbac.service';
import { Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PERMISSIONS, UserRole } from '../constants/permissions';
import * as jwt from 'jsonwebtoken';

@Controller('rbac')
@UseGuards(PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /**
   * Sincronizar todo o sistema RBAC
   */
  @Post('sync')
  @Permissions(PERMISSIONS.PERMISSION_CREATE, PERMISSIONS.ROLE_CREATE)
  async syncRbac() {
    await this.rbacService.fullSync();
    return { message: 'RBAC sincronizado com sucesso' };
  }

  /**
   * Obter permissões de um usuário
   */
  @Get('user/:userId/permissions')
  async getUserPermissions(@Param('userId') userId: string) {
    const permissions = await this.rbacService.getUserPermissions(userId);
    return { permissions };
  }

  /**
   * Conceder permissão a um usuário
   */
  @Post('user/:userId/permissions/:permission/grant')
  @Permissions(PERMISSIONS.USER_PERMISSION_MANAGE)
  async grantPermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    await this.rbacService.grantPermissionToUser(userId, permission);
    return { message: 'Permissão concedida com sucesso' };
  }

  /**
   * Revogar permissão de um usuário
   */
  @Post('user/:userId/permissions/:permission/revoke')
  @Permissions(PERMISSIONS.USER_PERMISSION_MANAGE)
  async revokePermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    await this.rbacService.revokePermissionFromUser(userId, permission);
    return { message: 'Permissão revogada com sucesso' };
  }

  /**
   * Verificar se usuário tem uma permissão
   */
  @Get('user/:userId/permissions/:permission/check')
  @Permissions(PERMISSIONS.USER_VIEW, PERMISSIONS.PERMISSION_VIEW)
  async checkPermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    const hasPermission = await this.rbacService.hasPermission(userId, permission as any);
    return { hasPermission };
  }

  /**
   * Listar todas as permissões disponíveis
   */
  @Get('permissions')
  async getAllPermissions() {
    const permissions = await this.rbacService.getAllPermissions();
    return { permissions };
  }

  /**
   * Obter permissões de um role específico
   */
  @Get('role/:role/permissions')
  async getRolePermissions(@Param('role') role: string) {
    const permissions = await this.rbacService.getRolePermissions(role as UserRole);
    return { permissions };
  }

  /**
   * Atualizar permissões de um role
   */
  @Put('role/:role/permissions')
  @Permissions(PERMISSIONS.ROLE_UPDATE, PERMISSIONS.USER_PERMISSION_MANAGE)
  async updateRolePermissions(
    @Param('role') role: string,
    @Body('permissions') permissions: string[],
  ) {
    await this.rbacService.updateRolePermissions(role as UserRole, permissions);
    return { message: 'Permissões do role atualizadas com sucesso' };
  }

  /**
   * Listar todos os usuários com suas permissões
   */
  @Get('users')
  async getAllUsers() {
    const users = await this.rbacService.getAllUsersWithPermissions();
    return { users };
  }

  /**
   * Atualizar permissões específicas de um usuário
   */
  @Put('user/:userId/permissions')
  @Permissions(PERMISSIONS.USER_PERMISSION_MANAGE)
  async updateUserPermissions(
    @Param('userId') userId: string,
    @Body('permissionCustomizations') permissionCustomizations: Record<string, boolean>,
  ) {
    await this.rbacService.updateUserSpecificPermissions(userId, permissionCustomizations);
    return { message: 'Permissões do usuário atualizadas com sucesso' };
  }

  /**
   * Obter permissões do usuário logado
   */
  @Get('my-permissions')
  async getMyPermissions(@Request() req: any) {
    // Extrair token do header
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new Error('Token não fornecido');
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      const userId = payload.sub;
      
      if (!userId) {
        throw new Error('Token inválido');
      }

      const permissions = await this.rbacService.getUserPermissions(userId);
      return { permissions };
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 