import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, MinLength, IsArray, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateMedicalRecordDto {
  @IsUUID()
  patient_id: string;

  @IsUUID()
  health_unit_id: string;

  @IsString()
  @MinLength(2, { message: 'Nome do paciente deve ter pelo menos 2 caracteres' })
  @MaxLength(200, { message: 'Nome do paciente não pode exceder 200 caracteres' })
  patient_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(14, { message: 'CPF não pode exceder 14 caracteres' })
  patient_cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Data de nascimento não pode exceder 10 caracteres' })
  patient_birth_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Gênero não pode exceder 20 caracteres' })
  patient_gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone não pode exceder 20 caracteres' })
  patient_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Email não pode exceder 100 caracteres' })
  patient_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Endereço não pode exceder 500 caracteres' })
  patient_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Tipo sanguíneo não pode exceder 10 caracteres' })
  blood_type?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Altura deve ser um número válido' })
  @Min(50, { message: 'Altura deve ser pelo menos 50cm' })
  @Max(300, { message: 'Altura não pode exceder 300cm' })
  height?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Peso deve ser um número válido' })
  @Min(1, { message: 'Peso deve ser pelo menos 1kg' })
  @Max(500, { message: 'Peso não pode exceder 500kg' })
  weight?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronic_diseases?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
