import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadFileDto } from './dto';

@Injectable()
export class MedicalFilesService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(uploadFileDto: UploadFileDto, userId: string) {
    // Validar tipo de arquivo
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedMimeTypes.includes(uploadFileDto.mime_type)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    // Validar tamanho do arquivo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (uploadFileDto.file_size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 10MB');
    }

    // Validar formato Base64
    if (!uploadFileDto.file_data || !uploadFileDto.file_data.startsWith('data:')) {
      throw new BadRequestException('Dados do arquivo inválidos. Esperado formato Base64 com data URL');
    }

    // Verificar se o prontuário existe
    const medicalRecord = await this.prisma.medical_record.findUnique({
      where: { id: uploadFileDto.medical_record_id }
    });

    if (!medicalRecord) {
      throw new NotFoundException('Prontuário não encontrado');
    }

    // Salvar arquivo no banco (Base64)
    const savedFile = await this.prisma.medical_file.create({
      data: {
        medical_record_id: uploadFileDto.medical_record_id,
        original_name: uploadFileDto.original_name,
        file_data: uploadFileDto.file_data, // Base64 string direto
        file_size: uploadFileDto.file_size,
        mime_type: uploadFileDto.mime_type,
        uploaded_by: userId,
        description: uploadFileDto.description
      }
    });

    return {
      id: savedFile.id,
      original_name: savedFile.original_name,
      file_size: savedFile.file_size,
      mime_type: savedFile.mime_type,
      uploaded_at: savedFile.uploaded_at,
      message: 'Arquivo enviado com sucesso'
    };
  }

  async downloadFile(fileId: string) {
    const file = await this.prisma.medical_file.findUnique({
      where: { id: fileId, is_active: true }
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return {
      original_name: file.original_name,
      file_data: file.file_data, // Retorna o Base64 string
      mime_type: file.mime_type,
      file_size: file.file_size
    };
  }

  async getFilesByMedicalRecord(medicalRecordId: string) {
    return this.prisma.medical_file.findMany({
      where: { 
        medical_record_id: medicalRecordId,
        is_active: true 
      },
      select: {
        id: true,
        original_name: true,
        file_size: true,
        mime_type: true,
        description: true,
        uploaded_at: true,
        uploader: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { uploaded_at: 'desc' }
    });
  }

  async deleteFile(fileId: string, userId: string) {
    const file = await this.prisma.medical_file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Soft delete - apenas marca como inativo
    await this.prisma.medical_file.update({
      where: { id: fileId },
      data: { is_active: false }
    });

    return { message: 'Arquivo excluído com sucesso' };
  }
}


