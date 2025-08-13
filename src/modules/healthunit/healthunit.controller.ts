import { Controller, Post, Get, Put, Delete, Body, Param, Req, HttpException, HttpStatus } from '@nestjs/common';
import { HealthUnitService } from './healthunit.service';
import { CreateHealthUnitDto, UpdateHealthUnitDto } from './healthunit.dto';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

@Controller('healthunit')
export class HealthUnitController {
  constructor(private readonly service: HealthUnitService) {}

  @Post()
  async create(@Body() dto: CreateHealthUnitDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Req() req) {
    // Extrair token do header para obter contexto do usuário
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    } catch (e) {
      throw new HttpException('Token inválido ou expirado', HttpStatus.UNAUTHORIZED);
    }

    const prisma = new PrismaClient();
    const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!dbUser) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Escopo padrão: todos para MASTER; ADMIN: por prefeitura e opcionalmente por unidade
    let where: any = {};
    if (dbUser.role === 'ADMIN') {
      if (!dbUser.city_id) {
        // ADMIN sem prefeitura não deve ver nada
        where = { id: '__none__' };
      } else {
        where = { city_hall_id: dbUser.city_id };
        if (dbUser.health_unit_id) {
          where = { ...where, id: dbUser.health_unit_id };
        }
      }
    }

    return this.service.findAll(where);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHealthUnitDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
