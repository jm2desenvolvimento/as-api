import { IsString, IsOptional, IsUUID, IsDateString, MaxLength, MinLength, IsNumber, Min } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  medical_record_id: string;

  @IsUUID()
  uploader_id: string;

  @IsString()
  @MinLength(3, { message: 'Nome do documento deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Nome do documento não pode exceder 200 caracteres' })
  name: string;

  @IsString()
  @MinLength(3, { message: 'Tipo do documento deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Tipo do documento não pode exceder 100 caracteres' })
  type: string;

  @IsString()
  @MinLength(10, { message: 'URL do arquivo deve ter pelo menos 10 caracteres' })
  @MaxLength(500, { message: 'URL do arquivo não pode exceder 500 caracteres' })
  file_url: string;

  @IsOptional()
  @IsNumber({}, { message: 'Tamanho do arquivo deve ser um número válido' })
  @Min(1, { message: 'Tamanho do arquivo deve ser pelo menos 1 byte' })
  file_size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tipo MIME não pode exceder 100 caracteres' })
  mime_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Descrição não pode exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data do documento deve estar em formato ISO válido' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Status não pode exceder 50 caracteres' })
  status?: string;
}
