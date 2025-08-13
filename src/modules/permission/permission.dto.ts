export class CreatePermissionDto {
  name: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
}

export class UpdatePermissionDto {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  is_active?: boolean;
} 