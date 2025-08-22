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
  date: string; // ✅ Corrigido: agora usa 'date' como o schema

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Resultado não pode exceder 2000 caracteres' })
  results?: string; // ✅ Corrigido: agora usa 'results' como o schema

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Laboratório não pode exceder 100 caracteres' })
  lab?: string; // ✅ Adicionado: campo lab do schema

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Status não pode exceder 100 caracteres' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Médico responsável não pode exceder 200 caracteres' })
  doctor_name?: string; // ✅ Corrigido: agora usa 'doctor_name' como o schema

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'URL do arquivo não pode exceder 500 caracteres' })
  file_url?: string; // ✅ Adicionado: campo file_url do schema
}
