import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityHallDto, UpdateCityHallDto } from './cityhall.dto';

@Injectable()
export class CityHallService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.city_hall.findMany();
  }

  async findOne(id: string) {
    const cityHall = await this.prisma.city_hall.findUnique({ where: { id } });
    if (!cityHall) throw new NotFoundException('Prefeitura não encontrada');
    return cityHall;
  }

  async create(data: CreateCityHallDto) {
    return this.prisma.city_hall.create({ data });
  }

  async update(id: string, data: UpdateCityHallDto) {
    return this.prisma.city_hall.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.city_hall.delete({ where: { id } });
  }
} 