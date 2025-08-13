import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../services/rbac.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../constants/permissions';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log('=== PERMISSIONS GUARD INICIADO ===');
    
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    this.logger.log(`Permissões necessárias: ${JSON.stringify(requiredPermissions)}`);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.log('✅ Nenhuma permissão necessária, acesso liberado');
      return true; // Se não há permissões definidas, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    this.logger.log(`Token extraído: ${token ? 'PRESENTE' : 'AUSENTE'}`);
    if (token) {
      this.logger.log(`Token (primeiros 20 chars): ${token.substring(0, 20)}...`);
    }
    
    if (!token) {
      this.logger.error('❌ Token não fornecido');
      throw new ForbiddenException('Token não fornecido');
    }

    try {
      this.logger.log('🔍 Verificando token JWT...');
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      const userId = payload.sub;
      
      this.logger.log(`Payload do token: ${JSON.stringify(payload)}`);
      this.logger.log(`User ID extraído: ${userId}`);
      
      if (!userId) {
        this.logger.error('❌ Token inválido - User ID não encontrado');
        throw new ForbiddenException('Token inválido');
      }

      this.logger.log('🔍 Verificando permissões do usuário...');
      // Verificar se o usuário tem todas as permissões necessárias
      const hasAllPermissions = await this.rbacService.hasPermissions(userId, requiredPermissions);
      
      this.logger.log(`Resultado da verificação de permissões: ${hasAllPermissions}`);
      
      if (!hasAllPermissions) {
        this.logger.error('❌ Permissões insuficientes');
        this.logger.error(`User ID: ${userId}`);
        this.logger.error(`Permissões necessárias: ${JSON.stringify(requiredPermissions)}`);
        throw new ForbiddenException('Permissões insuficientes');
      }

      this.logger.log('✅ Autorização concedida');
      
      // Adicionar informações do usuário à requisição para uso nos controllers
      request['user'] = {
        id: userId,
        ...payload
      };
      
      return true;
    } catch (error) {
      this.logger.error('❌ Erro durante verificação de permissões:', error.message);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 