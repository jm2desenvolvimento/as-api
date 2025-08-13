import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, MinLength, IsNumber, Min } from 'class-validator';

export class CreateExamDto {
  @IsUUID()
  medical_record_id: string;

  @IsUUID()
  doctor_id: string;

  @IsString()
  @MinLength(3, { message: 'Nome do exame deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Nome do exame não pode exceder 200 caracteres' })
  name: string;

  @IsString()
  @MinLength(5, { message: 'Tipo do exame deve ter pelo menos 5 caracteres' })
  @MaxLength(100, { message: 'Tipo do exame não pode exceder 100 caracteres' })
  type: string;

  @IsDateString({}, { message: 'Data do exame deve estar em formato ISO válido' })
  exam_date: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Resultado não pode exceder 2000 caracteres' })
  result?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Observações não podem exceder 1000 caracteres' })
  observations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Status não pode exceder 100 caracteres' })
  status?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Custo deve ser um número válido' })
  @Min(0, { message: 'Custo não pode ser negativo' })
  cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Local do exame não pode exceder 200 caracteres' })
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Médico responsável não pode exceder 200 caracteres' })
  responsible_doctor?: string;
}
