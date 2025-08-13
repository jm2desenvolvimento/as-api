import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsPositive, Min, IsEnum, IsDateString, IsUUID, IsArray } from 'class-validator';

export class CreateMedicalScheduleDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  doctor_id: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  health_unit_id: string;

  @IsDateString()
  start_datetime: string;

  @IsDateString()
  end_datetime: string;

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'temporary', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'temporary' | 'cancelled' = 'pending';

  @IsOptional()
  @IsInt()
  @IsPositive()
  total_slots?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  available_slots?: number = 0;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean = false;

  @IsOptional()
  @IsEnum(['none', 'daily', 'weekly', 'monthly'])
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' = 'none';

  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;

  @IsOptional()
  @IsString()
  recurrence_weekdays?: string; // JSON string com dias da semana

  // Recorrência avançada (RRULE)
  @IsOptional()
  @IsString()
  rrule?: string;

  @IsOptional()
  @IsArray()
  exdates?: string[]; // ISO strings das exceções

  @IsOptional()
  @IsString()
  timezone?: string; // ex.: 'America/Sao_Paulo'

  @IsOptional()
  @IsString()
  @IsUUID()
  substitute_doctor_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
