import { Body, Controller, Get, Post, UseGuards, ForbiddenException, Req, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS, UserRole } from '../auth/constants/permissions';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.USER_LIST)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.USER_CREATE)
  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    // Regra de negócio: somente MASTER pode criar ADMIN
    if (dto.role === UserRole.ADMIN && req?.user?.role !== UserRole.MASTER) {
      throw new ForbiddenException('Apenas MASTER pode criar usuários ADMIN');
    }
    return this.usersService.create(dto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.USER_UPDATE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    // Buscar o alvo para regras de negócio
    const target = await this.usersService.findById(id);
    if (!target) throw new NotFoundException('Usuário não encontrado');

    // Somente MASTER pode atualizar ADMIN ou promover alguém a ADMIN
    if ((target.role === UserRole.ADMIN || dto.role === UserRole.ADMIN) && req?.user?.role !== UserRole.MASTER) {
      throw new ForbiddenException('Apenas MASTER pode atualizar usuários ADMIN');
    }

    return this.usersService.update(id, dto);
  }

  @UseGuards(PermissionsGuard)
  @Permissions(PERMISSIONS.USER_DELETE)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    // Impedir exclusão de si mesmo
    if (req?.user?.id === id) {
      throw new ForbiddenException('Você não pode excluir a si mesmo');
    }

    const target = await this.usersService.findById(id);
    if (!target) throw new NotFoundException('Usuário não encontrado');

    // Impedir exclusão de MASTER
    if (target.role === UserRole.MASTER) {
      throw new ForbiddenException('Não é permitido excluir um usuário MASTER');
    }

    // Somente MASTER pode excluir ADMIN
    if (target.role === UserRole.ADMIN && req?.user?.role !== UserRole.MASTER) {
      throw new ForbiddenException('Apenas MASTER pode excluir usuários ADMIN');
    }

    return this.usersService.remove(id);
  }
}