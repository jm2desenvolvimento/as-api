import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, MinLength, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreateMedicationDto {
  @IsUUID()
  medical_record_id: string;

  @IsUUID()
  doctor_id: string;

  @IsString()
  @MinLength(2, { message: 'Nome do medicamento deve ter pelo menos 2 caracteres' })
  @MaxLength(200, { message: 'Nome do medicamento não pode exceder 200 caracteres' })
  name: string;

  @IsString()
  @MinLength(3, { message: 'Dosagem deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Dosagem não pode exceder 100 caracteres' })
  dosage: string;

  @IsString()
  @MinLength(5, { message: 'Frequência deve ter pelo menos 5 caracteres' })
  @MaxLength(200, { message: 'Frequência não pode exceder 200 caracteres' })
  frequency: string;

  @IsDateString({}, { message: 'Data de início deve estar em formato ISO válido' })
  start_date: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve estar em formato ISO válido' })
  end_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Instruções não podem exceder 1000 caracteres' })
  instructions?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Quantidade deve ser um número válido' })
  @Min(1, { message: 'Quantidade deve ser pelo menos 1' })
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Unidade não pode exceder 100 caracteres' })
  unit?: string;
}
