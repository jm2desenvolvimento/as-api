import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { MedicalRecordsService } from './medicalrecords.service';
import { MedicalFilesService } from './medical-files.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions';
import { 
  CreateMedicalRecordDto, 
  UpdateMedicalRecordDto,
  CreateConsultationDto,
  UpdateConsultationDto,
  CreateMedicationDto,
  UpdateMedicationDto,
  CreateExamDto,
  UpdateExamDto,
  CreateDocumentDto,
  UpdateDocumentDto,
  UploadFileDto
} from './dto';

@Controller('medical-records')
@UseGuards(PermissionsGuard)
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly medicalFilesService: MedicalFilesService
  ) {}

  @Get()
  @Permissions(PERMISSIONS.MEDICAL_RECORD_LIST)
  async findAll() {
    return this.medicalRecordsService.findAllMedicalRecords();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findMedicalRecordById(id);
  }

  @Get('patient/:patientId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findByPatientId(@Param('patientId') patientId: string) {
    const medicalRecord = await this.medicalRecordsService.findMedicalRecordByPatientId(patientId);
    
    if (!medicalRecord) {
      throw new NotFoundException(`Prontuário não encontrado para o paciente ${patientId}`);
    }
    
    return medicalRecord;
  }

  @Post('patient/:patientId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_CREATE)
  async createForPatient(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.createMedicalRecordForPatient(patientId);
  }

  @Post()
  @Permissions(PERMISSIONS.MEDICAL_RECORD_CREATE)
  async create(@Body() createMedicalRecordDto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.createMedicalRecord(createMedicalRecordDto);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async update(@Param('id') id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.updateMedicalRecord(id, updateMedicalRecordDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_DELETE)
  async remove(@Param('id') id: string) {
    return this.medicalRecordsService.deleteMedicalRecord(id);
  }

  // Endpoints para consultas
  @Get(':id/consultations')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findConsultations(@Param('id') id: string) {
    return this.medicalRecordsService.findConsultationsByMedicalRecordId(id);
  }

  // Endpoints para medicamentos
  @Get(':id/medications')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findMedications(@Param('id') id: string) {
    return this.medicalRecordsService.findMedicationsByMedicalRecordId(id);
  }

  // Endpoints para exames
  @Get(':id/exams')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findExams(@Param('id') id: string) {
    return this.medicalRecordsService.findExamsByMedicalRecordId(id);
  }

  // Endpoints para documentos
  @Get(':id/documents')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async findDocuments(@Param('id') id: string) {
    return this.medicalRecordsService.findDocumentsByMedicalRecordId(id);
  }

  // Endpoint agregador para o Resumo de Saúde dinâmico
  @Get(':id/health-summary')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async getHealthSummary(@Param('id') id: string) {
    return this.medicalRecordsService.getHealthSummary(id);
  }

  // ========== ENDPOINTS CRUD PARA CONSULTAS ==========
  @Post('consultations')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async createConsultation(@Body() createConsultationDto: CreateConsultationDto) {
    return this.medicalRecordsService.createConsultation(createConsultationDto);
  }

  @Put('consultations/:consultationId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async updateConsultation(
    @Param('consultationId') consultationId: string,
    @Body() updateConsultationDto: UpdateConsultationDto
  ) {
    return this.medicalRecordsService.updateConsultation(consultationId, updateConsultationDto);
  }

  @Delete('consultations/:consultationId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async deleteConsultation(@Param('consultationId') consultationId: string) {
    return this.medicalRecordsService.deleteConsultation(consultationId);
  }

  // ========== ENDPOINTS CRUD PARA MEDICAMENTOS ==========
  @Post('medications')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async createMedication(@Body() createMedicationDto: CreateMedicationDto) {
    return this.medicalRecordsService.createMedication(createMedicationDto);
  }

  @Put('medications/:medicationId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async updateMedication(
    @Param('medicationId') medicationId: string,
    @Body() updateMedicationDto: UpdateMedicationDto
  ) {
    return this.medicalRecordsService.updateMedication(medicationId, updateMedicationDto);
  }

  @Delete('medications/:medicationId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async deleteMedication(@Param('medicationId') medicationId: string) {
    return this.medicalRecordsService.deleteMedication(medicationId);
  }

  // ========== ENDPOINTS CRUD PARA EXAMES ==========
  @Post('exams')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async createExam(@Body() createExamDto: CreateExamDto) {
    return this.medicalRecordsService.createExam(createExamDto);
  }

  @Put('exams/:examId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async updateExam(
    @Param('examId') examId: string,
    @Body() updateExamDto: UpdateExamDto
  ) {
    return this.medicalRecordsService.updateExam(examId, updateExamDto);
  }

  @Delete('exams/:examId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async deleteExam(@Param('examId') examId: string) {
    return this.medicalRecordsService.deleteExam(examId);
  }

  // ========== ENDPOINTS CRUD PARA DOCUMENTOS ==========
  @Post('documents')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async createDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.medicalRecordsService.createDocument(createDocumentDto);
  }

  @Put('documents/:documentId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async updateDocument(
    @Param('documentId') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto
  ) {
    return this.medicalRecordsService.updateDocument(documentId, updateDocumentDto);
  }

  @Delete('documents/:documentId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async deleteDocument(@Param('documentId') documentId: string) {
    return this.medicalRecordsService.deleteDocument(documentId);
  }

  // ========== ENDPOINTS PARA ARQUIVOS ==========
  @Post('upload')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async uploadFile(
    @Body() uploadFileDto: UploadFileDto,
    @Req() req: any
  ) {
    return this.medicalFilesService.uploadFile(uploadFileDto, req.user.id);
  }

  @Get('files/:medicalRecordId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async getFiles(@Param('medicalRecordId') medicalRecordId: string) {
    return this.medicalFilesService.getFilesByMedicalRecord(medicalRecordId);
  }

  @Get('files/download/:fileId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_VIEW)
  async downloadFile(@Param('fileId') fileId: string) {
    return this.medicalFilesService.downloadFile(fileId);
  }

  @Delete('files/:fileId')
  @Permissions(PERMISSIONS.MEDICAL_RECORD_UPDATE)
  async deleteFile(@Param('fileId') fileId: string, @Req() req: any) {
    return this.medicalFilesService.deleteFile(fileId, req.user.id);
  }
}
