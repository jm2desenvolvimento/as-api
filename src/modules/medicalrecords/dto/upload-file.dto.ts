import { IsString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';

export class UploadFileDto {
  @IsUUID()
  medical_record_id: string;

  @IsString()
  original_name: string;

  @IsString()
  file_data: string; // Base64 string

  @IsNumber()
  @Min(1, { message: 'Tamanho do arquivo deve ser pelo menos 1 byte' })
  @Max(10 * 1024 * 1024, { message: 'Tamanho do arquivo não pode exceder 10MB' })
  file_size: number;

  @IsString()
  mime_type: string;

  @IsOptional()
  @IsString()
  description?: string;
}


