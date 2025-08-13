// Script para excluir usuários específicos por ID
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDs específicos para excluir
const patientIdsToDelete = [
  'c3ae1581-e215-4f42-9287-7de50493abbd',
  '15d21474-4b94-437f-a79f-91a603229ff8'
];

async function deletePatient(patientId) {
  try {
    console.log(`Iniciando exclusão do paciente ID: ${patientId}`);
    
    // 1. Encontrar o profile_id associado ao usuário
    const profile = await prisma.profile.findUnique({
      where: { user_id: patientId }
    });
    
    if (!profile) {
      console.log(`Perfil não encontrado para o usuário ${patientId}, pulando...`);
      return;
    }
    
    const profileId = profile.id;
    console.log(`Profile ID: ${profileId}`);
    
    // 2. Encontrar o medical_record_id associado ao profile
    const medicalRecord = await prisma.medical_record.findFirst({
      where: { patient_id: profileId }
    });
    
    if (medicalRecord) {
      const medicalRecordId = medicalRecord.id;
      console.log(`Medical Record ID: ${medicalRecordId}`);
      
      // 3. Verificar e excluir documentos
      try {
        const deletedDocuments = await prisma.document.deleteMany({
          where: { medical_record_id: medicalRecordId }
        });
        console.log(`Documentos médicos excluídos: ${deletedDocuments.count}`);
      } catch (error) {
        console.log('Tabela document não encontrada ou erro ao excluir documentos:', error.message);
      }
      
      // 4. Verificar e excluir exames
      try {
        const deletedExams = await prisma.exam.deleteMany({
          where: { medical_record_id: medicalRecordId }
        });
        console.log(`Exames médicos excluídos: ${deletedExams.count}`);
      } catch (error) {
        console.log('Tabela exam não encontrada ou erro ao excluir exames:', error.message);
      }
      
      // 5. Verificar e excluir medicações
      try {
        const deletedMedications = await prisma.medication.deleteMany({
          where: { medical_record_id: medicalRecordId }
        });
        console.log(`Medicações excluídas: ${deletedMedications.count}`);
      } catch (error) {
        console.log('Tabela medication não encontrada ou erro ao excluir medicações:', error.message);
      }
      
      // 6. Verificar e excluir consultas
      try {
        const deletedConsultations = await prisma.consultation.deleteMany({
          where: { medical_record_id: medicalRecordId }
        });
        console.log(`Consultas excluídas: ${deletedConsultations.count}`);
      } catch (error) {
        console.log('Tabela consultation não encontrada ou erro ao excluir consultas:', error.message);
      }
      
      // 7. Excluir o prontuário médico
      await prisma.medical_record.delete({
        where: { id: medicalRecordId }
      });
      console.log(`Prontuário médico excluído: ${medicalRecordId}`);
    } else {
      console.log(`Nenhum prontuário médico encontrado para o perfil ${profileId}`);
    }
    
    // 8. Verificar e remover referências do perfil em outras tabelas
    
    // 8.1 Verificar se o perfil é médico em consultas
    try {
      await prisma.consultation.updateMany({
        where: { doctor_id: profileId },
        data: { doctor_id: null }
      });
      console.log(`Referências de médico em consultas removidas`);
    } catch (error) {
      console.log('Erro ao remover referências de médico em consultas:', error.message);
    }
    
    // 8.2 Verificar se o perfil é médico em medicações
    try {
      await prisma.medication.updateMany({
        where: { prescribed_by: profileId },
        data: { prescribed_by: null }
      });
      console.log(`Referências de médico em medicações removidas`);
    } catch (error) {
      console.log('Erro ao remover referências de médico em medicações:', error.message);
    }
    
    // 8.3 Verificar se o perfil é médico em exames
    try {
      await prisma.exam.updateMany({
        where: { requested_by: profileId },
        data: { requested_by: null }
      });
      console.log(`Referências de médico em exames removidas`);
    } catch (error) {
      console.log('Erro ao remover referências de médico em exames:', error.message);
    }
    
    // 8.4 Verificar se o perfil é uploader em documentos
    try {
      await prisma.document.updateMany({
        where: { uploaded_by: profileId },
        data: { uploaded_by: null }
      });
      console.log(`Referências de uploader em documentos removidas`);
    } catch (error) {
      console.log('Erro ao remover referências de uploader em documentos:', error.message);
    }
    
    // 9. Excluir perfil de médico se existir
    try {
      const deletedDoctorProfile = await prisma.profile_doctor.deleteMany({
        where: { profile_id: profileId }
      });
      if (deletedDoctorProfile.count > 0) {
        console.log(`Perfil de médico excluído`);
      }
    } catch (error) {
      console.log('Erro ao excluir perfil de médico:', error.message);
    }
    
    // 10. Excluir telefones do perfil
    const deletedPhones = await prisma.profile_phone.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Telefones excluídos: ${deletedPhones.count}`);
    
    // 11. Excluir emails do perfil
    const deletedEmails = await prisma.profile_email.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Emails excluídos: ${deletedEmails.count}`);
    
    // 12. Excluir endereços do perfil
    const deletedAddresses = await prisma.profile_address.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Endereços excluídos: ${deletedAddresses.count}`);
    
    // 13. Excluir o perfil
    await prisma.profile.delete({
      where: { id: profileId }
    });
    console.log(`Perfil excluído: ${profileId}`);
    
    // 14. Excluir o usuário
    await prisma.user.delete({
      where: { id: patientId }
    });
    console.log(`Usuário excluído: ${patientId}`);
    
    console.log(`Paciente ${patientId} excluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir paciente ${patientId}:`, error);
    return false;
  }
}

async function main() {
  try {
    console.log(`Iniciando exclusão de ${patientIdsToDelete.length} pacientes específicos.`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Excluir cada paciente específico
    for (const patientId of patientIdsToDelete) {
      const success = await deletePatient(patientId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log(`Processo de limpeza concluído.`);
    console.log(`Pacientes excluídos com sucesso: ${successCount}`);
    console.log(`Falhas na exclusão: ${failCount}`);
  } catch (error) {
    console.error('Erro durante o processo de limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
