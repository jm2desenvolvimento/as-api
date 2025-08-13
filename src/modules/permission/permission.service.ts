import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePermissionDto, UpdatePermissionDto } from './permission.dto';

const prisma = new PrismaClient();

@Injectable()
export class PermissionService {
  async create(data: CreatePermissionDto) {
    return prisma.permission.create({ data });
  }

  async findAll() {
    return prisma.permission.findMany();
  }

  async findOne(id: string) {
    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(id: string, data: UpdatePermissionDto) {
    return prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    return prisma.permission.delete({ where: { id } });
  }
} 