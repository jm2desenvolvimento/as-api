import { UserRole } from '@prisma/client';

export class CreateRolePermissionDto {
  role: UserRole;
  permission_id: string;
}

export class UpdateRolePermissionDto {
  role?: UserRole;
  permission_id?: string;
} 