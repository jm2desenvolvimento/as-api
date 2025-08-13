import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UserRole } from '../auth/constants/permissions';

const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  async findAll() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        cpf: true,
        role: true,
        is_active: true,
        city_id: true,
        health_unit_id: true,
        profile: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    // Achatar profile.name para name
    return users.map(u => ({
      id: u.id,
      email: u.email,
      cpf: u.cpf,
      role: u.role,
      is_active: u.is_active,
      city_id: u.city_id,
      health_unit_id: u.health_unit_id,
      name: u.profile?.name ?? null,
    }));
  }

  async create(dto: CreateUserDto) {
    // Validações de negócio
    if (dto.role === UserRole.ADMIN) {
      if (!dto.city_id) {
        throw new BadRequestException('city_id é obrigatório para criar ADMIN');
      }
    }

    // Validar unicidade de email e cpf
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { cpf: dto.cpf }],
      },
      select: { id: true, email: true, cpf: true },
    });
    if (existing) {
      if (existing.email === dto.email) {
        throw new BadRequestException('E-mail já cadastrado');
      }
      if (existing.cpf === dto.cpf) {
        throw new BadRequestException('CPF já cadastrado');
      }
    }

    // Se city_id informado, verificar existência
    if (dto.city_id) {
      const city = await prisma.city_hall.findUnique({ where: { id: dto.city_id } });
      if (!city) throw new NotFoundException('Prefeitura (city_id) não encontrada');
    }

    // Se health_unit_id informado, validar que pertence à prefeitura selecionada (se houver)
    if (dto.health_unit_id) {
      const unit = await prisma.health_unit.findUnique({ where: { id: dto.health_unit_id } });
      if (!unit) throw new NotFoundException('Unidade de saúde (health_unit_id) não encontrada');
      if (dto.city_id && unit.city_hall_id !== dto.city_id) {
        throw new BadRequestException('A unidade de saúde não pertence à prefeitura selecionada');
      }
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: dto.email,
          password: hashed,
          cpf: dto.cpf,
          role: dto.role,
          city_id: dto.city_id ?? null,
          health_unit_id: dto.health_unit_id ?? null,
          is_active: true,
          allowed: {},
        },
      }),
    ]);

    // Criar profile com name obrigatório
    await prisma.profile.create({
      data: {
        user_id: user.id,
        name: dto.name,
      },
    });

    // Retornar sem password
    return {
      id: user.id,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      is_active: user.is_active,
      city_id: user.city_id,
      health_unit_id: user.health_unit_id,
      name: dto.name,
    };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, cpf: true, city_id: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        cpf: true,
        role: true,
        city_id: true,
        health_unit_id: true,
        profile: { select: { id: true, name: true, user_id: true } },
      },
    });
    if (!current) throw new NotFoundException('Usuário não encontrado');

    // Unicidade de e-mail
    if (dto.email && dto.email !== current.email) {
      const exists = await prisma.user.findFirst({ where: { email: dto.email, NOT: { id: current.id } }, select: { id: true } });
      if (exists) throw new BadRequestException('E-mail já cadastrado');
    }

    // Unicidade de CPF
    if (dto.cpf && dto.cpf !== current.cpf) {
      const exists = await prisma.user.findFirst({ where: { cpf: dto.cpf, NOT: { id: current.id } }, select: { id: true } });
      if (exists) throw new BadRequestException('CPF já cadastrado');
    }

    // Validar city/health_unit
    const effectiveCityId = dto.city_id !== undefined ? dto.city_id : current.city_id;
    if (dto.city_id) {
      const city = await prisma.city_hall.findUnique({ where: { id: dto.city_id } });
      if (!city) throw new NotFoundException('Prefeitura (city_id) não encontrada');
    }
    if (dto.health_unit_id) {
      const unit = await prisma.health_unit.findUnique({ where: { id: dto.health_unit_id } });
      if (!unit) throw new NotFoundException('Unidade de saúde (health_unit_id) não encontrada');
      if (effectiveCityId && unit.city_hall_id !== effectiveCityId) {
        throw new BadRequestException('A unidade de saúde não pertence à prefeitura selecionada');
      }
    }

    const dataUser: any = {};
    if (dto.email !== undefined) dataUser.email = dto.email;
    if (dto.cpf !== undefined) dataUser.cpf = dto.cpf;
    if (dto.role !== undefined) dataUser.role = dto.role;
    if (dto.city_id !== undefined) dataUser.city_id = dto.city_id;
    if (dto.health_unit_id !== undefined) dataUser.health_unit_id = dto.health_unit_id;
    if (dto.is_active !== undefined) dataUser.is_active = dto.is_active;
    if (dto.password) dataUser.password = await bcrypt.hash(dto.password, 10);

    await prisma.user.update({ where: { id }, data: dataUser });

    if (dto.name !== undefined) {
      const existingProfile = await prisma.profile.findFirst({ where: { user_id: id }, select: { id: true } });
      if (existingProfile) {
        await prisma.profile.update({ where: { id: existingProfile.id }, data: { name: dto.name } });
      } else {
        await prisma.profile.create({ data: { user_id: id, name: dto.name ?? '' } });
      }
    }

    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        cpf: true,
        role: true,
        is_active: true,
        city_id: true,
        health_unit_id: true,
        profile: { select: { name: true } },
      },
    });

    return {
      id: updated!.id,
      email: updated!.email,
      cpf: updated!.cpf,
      role: updated!.role,
      is_active: updated!.is_active,
      city_id: updated!.city_id,
      health_unit_id: updated!.health_unit_id,
      name: updated!.profile?.name ?? null,
    };
  }

  async remove(id: string) {
    const exists = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Usuário não encontrado');

    await prisma.$transaction([
      prisma.profile.deleteMany({ where: { user_id: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }
}