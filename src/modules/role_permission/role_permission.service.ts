import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';
import { CreateRolePermissionDto, UpdateRolePermissionDto } from './role_permission.dto';

const prisma = new PrismaClient();

@Injectable()
export class RolePermissionService {
  async create(data: CreateRolePermissionDto) {
    return prisma.role_permission.create({ data: { ...data, role: data.role as UserRole } });
  }

  async findAll() {
    return prisma.role_permission.findMany();
  }

  async findOne(id: string) {
    const rolePermission = await prisma.role_permission.findUnique({ where: { id } });
    if (!rolePermission) throw new NotFoundException('RolePermission not found');
    return rolePermission;
  }

  async update(id: string, data: UpdateRolePermissionDto) {
    return prisma.role_permission.update({ where: { id }, data: { ...data, role: data.role as UserRole } });
  }

  async remove(id: string) {
    return prisma.role_permission.delete({ where: { id } });
  }

  async findByRole(role: string) {
    return prisma.role_permission.findMany({
      where: { role: role as UserRole },
      include: { permission: true }
    });
  }

  async updateRolePermissions(role: string, permissions: string[]) {
    await prisma.role_permission.deleteMany({ where: { role: role as UserRole } });
    for (const permission_id of permissions) {
      await prisma.role_permission.create({
        data: { role: role as UserRole, permission_id }
      });
    }
    return { message: 'Permissões do perfil atualizadas com sucesso' };
  }
} 