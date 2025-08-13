import { Module } from '@nestjs/common';
import { RolePermissionService } from './role_permission.service';
import { RolePermissionController } from './role_permission.controller';

@Module({
  providers: [RolePermissionService],
  controllers: [RolePermissionController],
})
export class RolePermissionModule {} 