import { IsEmail, IsString, IsOptional, IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreatePhoneDto {
  @IsString()
  phone: string;

  @IsEnum(['Celular', 'Fixo', 'Comercial', 'Outro'])
  phone_type: string;

  @IsBoolean()
  is_primary: boolean;
}

export class CreateEmailDto {
  @IsEmail()
  email: string;
}

export class CreateAddressDto {
  @IsString()
  address: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  district: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip_code: string;

  @IsEnum(['Residencial', 'Comercial', 'Outro'])
  address_type: string;

  @IsBoolean()
  is_primary: boolean;
}

export class CreatePatientDto {
  // Dados de Usuário
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  cpf: string;

  // Dados do Perfil
  @IsString()
  name: string;

  @IsDateString()
  birth_date: string;

  @IsEnum(['Masculino', 'Feminino', 'Outro'])
  gender: string;

  @IsOptional()
  @IsString()
  sus_card?: string;

  // ✅ NOVOS CAMPOS OBRIGATÓRIOS PARA VINCULAÇÃO TERRITORIAL
  @IsString()
  @IsNotEmpty()
  city_id: string;        // ID da prefeitura (city_hall)

  @IsString()
  @IsNotEmpty()
  health_unit_id: string; // ID da UBS específica

  // Contatos
  @IsArray()
  phones: CreatePhoneDto[];

  @IsArray()
  emails: CreateEmailDto[];

  // Endereços
  @IsArray()
  addresses: CreateAddressDto[];
} 