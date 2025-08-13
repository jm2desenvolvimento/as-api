import { PartialType } from '@nestjs/mapped-types';
import { CreateMedicalRecordDto } from './create-medical-record.dto';
import { IsOptional, IsUUID, IsString, MaxLength, MinLength, IsDateString } from 'class-validator';

export class UpdateMedicalRecordDto extends PartialType(CreateMedicalRecordDto) {
  @IsOptional()
  @IsUUID()
  patient_id?: string;

  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Número do prontuário deve ter pelo menos 3 caracteres' })
  @MaxLength(50, { message: 'Número do prontuário não pode exceder 50 caracteres' })
  record_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Observações não podem exceder 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de atualização deve estar em formato ISO válido' })
  updated_at?: string;
}
