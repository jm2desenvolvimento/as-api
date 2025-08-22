import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, MinLength, IsNumber, Min } from 'class-validator';

export class CreateConsultationDto {
  @IsUUID()
  medical_record_id: string;

  @IsUUID()
  doctor_id: string;

  @IsDateString({}, { message: 'Data da consulta deve estar em formato ISO válido' })
  consultation_date: string;

  @IsString()
  @MinLength(10, { message: 'Motivo da consulta deve ter pelo menos 10 caracteres' })
  @MaxLength(500, { message: 'Motivo da consulta não pode exceder 500 caracteres' })
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Diagnóstico não pode exceder 2000 caracteres' })
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Observações não podem exceder 2000 caracteres' })
  observations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Prescrições não podem exceder 1000 caracteres' })
  prescriptions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Status não pode exceder 50 caracteres' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nome do médico não pode exceder 100 caracteres' })
  doctor_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Especialidade não pode exceder 100 caracteres' })
  specialty?: string;
}
