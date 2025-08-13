import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RbacService } from './services/rbac.service';
import { RbacController } from './controllers/rbac.controller';
import { PermissionsGuard } from './guards/permissions.guard';
 
@Module({
  controllers: [AuthController, RbacController],
  providers: [AuthService, RbacService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class AuthModule {} 