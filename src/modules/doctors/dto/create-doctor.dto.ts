import { IsEmail, IsNotEmpty, IsString, IsOptional, IsDateString, MinLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class CreatePhoneDto {
  @IsString()
  phone: string;

  @IsString()
  phone_type: string;

  @IsNotEmpty()
  is_primary: boolean;
}

class CreateEmailDto {
  @IsEmail()
  email: string;
}

class CreateAddressDto {
  @IsString()
  address: string;

  @IsString()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  district: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip_code: string;

  @IsString()
  address_type: string;

  @IsNotEmpty()
  is_primary: boolean;
}

export class CreateDoctorDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  cpf: string;

  @IsString()
  name: string;

  @IsDateString()
  birth_date: string;

  @IsString()
  gender: string;

  @IsString()
  crm_number: string;

  @IsString()
  crm_uf: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;      // ✅ ESPECIALIDADE DO MÉDICO

  // ✅ NOVOS CAMPOS OBRIGATÓRIOS PARA VINCULAÇÃO TERRITORIAL
  @IsString()
  @IsNotEmpty()
  city_id: string;        // ID da prefeitura (city_hall)

  @IsString()
  @IsNotEmpty()
  health_unit_id: string; // ID da UBS específica

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePhoneDto)
  phones: CreatePhoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmailDto)
  emails: CreateEmailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses: CreateAddressDto[];
} 