import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as jwt from 'jsonwebtoken';
import { RbacService } from './services/rbac.service';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private rbacService: RbacService) {}

  async validateUser(credentials: AuthCredentialsDto) {
    const { identifier, password } = credentials;
    // Buscar por email ou cpf
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { cpf: identifier },
        ],
        is_active: true,
      },
      include: { profile: true },
    });
    if (!user) return null;
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;
    // Obter permissões do usuário
    const permissions = await this.rbacService.getUserPermissions(user.id);

    // Gerar token JWT (inclui city_id e health_unit_id para facilitar auditoria/cliente, opcional)
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        city_id: (user as any).city_id,
        health_unit_id: (user as any).health_unit_id,
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' } // Expira em 24 horas
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        city_id: (user as any).city_id ?? null,
        health_unit_id: (user as any).health_unit_id ?? null,
        profile: user.profile,
        permissions,
      },
    };
  }
}