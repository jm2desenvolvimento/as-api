import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateHealthUnitDto, UpdateHealthUnitDto } from './healthunit.dto';

const prisma = new PrismaClient();

@Injectable()
export class HealthUnitService {
  async create(data: CreateHealthUnitDto) {
    return prisma.health_unit.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        phone: data.phone,
        email: data.email,
        city_hall_id: data.city_hall_id,
      },
    });
  }

  async findAll(where: any = {}) {
    return prisma.health_unit.findMany({
      where,
      include: { city_hall: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await prisma.health_unit.findUnique({
      where: { id },
      include: { city_hall: true },
    });
    if (!unit) throw new NotFoundException('Unidade de saúde não encontrada');
    return unit;
  }

  async update(id: string, data: UpdateHealthUnitDto) {
    // Garante que city_hall_id é string se vier no update
    const updateData = { ...data };
    if (updateData.city_hall_id !== undefined) {
      updateData.city_hall_id = String(updateData.city_hall_id);
    }
    return prisma.health_unit.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return prisma.health_unit.delete({
      where: { id },
    });
  }
}
