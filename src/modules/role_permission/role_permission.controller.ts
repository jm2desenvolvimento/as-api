import { Controller, Get, Query, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { CreateRolePermissionDto, UpdateRolePermissionDto } from './role_permission.dto';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly service: RolePermissionService) {}

  @Post()
  create(@Body() dto: CreateRolePermissionDto) {
    return this.service.create(dto);
  }

  @Get()
  findByRole(@Query('role') role?: string) {
    if (role) {
      return this.service.findByRole(role);
    }
    return this.service.findAll();
  }

  @Put()
  async updateRolePermissions(
    @Body() body: { role: string; permissions: string[] }
  ) {
    return this.service.updateRolePermissions(body.role, body.permissions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRolePermissionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
} 