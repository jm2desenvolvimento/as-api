// DTOs principais do MedicalRecord
export { CreateMedicalRecordDto } from './create-medical-record.dto';
export { UpdateMedicalRecordDto } from './update-medical-record.dto';

// DTOs das entidades relacionadas
export { CreateConsultationDto } from './create-consultation.dto';
export { CreateMedicationDto } from './create-medication.dto';
export { CreateExamDto } from './create-exam.dto';
export { CreateDocumentDto } from './create-document.dto';

// DTOs de atualização para entidades relacionadas (usando PartialType)
import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultationDto } from './create-consultation.dto';
import { CreateMedicationDto } from './create-medication.dto';
import { CreateExamDto } from './create-exam.dto';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateConsultationDto extends PartialType(CreateConsultationDto) {}
export class UpdateMedicationDto extends PartialType(CreateMedicationDto) {}
export class UpdateExamDto extends PartialType(CreateExamDto) {}
export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {}
