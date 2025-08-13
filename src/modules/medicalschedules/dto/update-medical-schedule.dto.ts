import { IsString, IsOptional, IsBoolean, IsInt, IsPositive, Min, IsEnum, IsDateString, IsUUID } from 'class-validator';

export class UpdateMedicalScheduleDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  doctor_id?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  health_unit_id?: string;

  @IsOptional()
  @IsDateString()
  start_datetime?: string;

  @IsOptional()
  @IsDateString()
  end_datetime?: string;

  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'temporary', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'temporary' | 'cancelled';

  @IsOptional()
  @IsInt()
  @IsPositive()
  total_slots?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  available_slots?: number;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsEnum(['none', 'daily', 'weekly', 'monthly'])
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly';

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
  exdates?: string[]; // ISO strings

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  substitute_doctor_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
