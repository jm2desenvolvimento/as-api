import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePermissionDto) {
    console.log('🔍 [PermissionService] Dados recebidos:', data);
    console.log('🔍 [PermissionService] Tipo dos dados:', typeof data);
    console.log('🔍 [PermissionService] Dados stringificados:', JSON.stringify(data));
    console.log('🔍 [PermissionService] Campo name:', data.name);
    console.log('🔍 [PermissionService] Campo name tipo:', typeof data.name);
    
    return this.prisma.permission.create({ data });
  }

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(id: string, data: UpdatePermissionDto) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.permission.delete({ where: { id } });
  }
} 