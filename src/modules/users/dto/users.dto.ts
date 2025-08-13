import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { UserRole } from '../../auth/constants/permissions';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @Length(11, 14)
  cpf: string;

  @IsEnum(UserRole)
  role: UserRole;

  // Obrigatório para ADMIN (validado no serviço/controlador)
  @IsOptional()
  @IsString()
  city_id?: string;

  // Opcional, mas se enviado deve pertencer à prefeitura (validado no serviço)
  @IsOptional()
  @IsString()
  health_unit_id?: string;

  // Nome do perfil do usuário
  @IsString()
  name: string;
}

export class UserListItemDto {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  city_id?: string | null;
  health_unit_id?: string | null;
  name?: string | null;
}

// DTO para atualização parcial de usuário (PATCH)
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @Length(11, 14)
  cpf?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  city_id?: string | null;

  @IsOptional()
  @IsString()
  health_unit_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

