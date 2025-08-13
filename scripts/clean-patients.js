// Script para excluir todos os usuários com role PATIENT, exceto o de email patient@agendasaude.com
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
      
      // 3. Excluir documentos médicos
      const deletedDocuments = await prisma.medical_document.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Documentos médicos excluídos: ${deletedDocuments.count}`);
      
      // 4. Excluir exames médicos
      const deletedExams = await prisma.medical_exam.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Exames médicos excluídos: ${deletedExams.count}`);
      
      // 5. Encontrar prescrições para excluir itens
      const prescriptions = await prisma.prescription.findMany({
        where: { medical_record_id: medicalRecordId }
      });
      
      // 6. Excluir itens de prescrição
      for (const prescription of prescriptions) {
        const deletedItems = await prisma.prescription_item.deleteMany({
          where: { prescription_id: prescription.id }
        });
        console.log(`Itens de prescrição excluídos para prescrição ${prescription.id}: ${deletedItems.count}`);
      }
      
      // 7. Excluir prescrições
      const deletedPrescriptions = await prisma.prescription.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Prescrições excluídas: ${deletedPrescriptions.count}`);
      
      // 8. Excluir tratamentos
      const deletedTreatments = await prisma.treatment.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Tratamentos excluídos: ${deletedTreatments.count}`);
      
      // 9. Excluir diagnósticos
      const deletedDiagnoses = await prisma.diagnosis.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Diagnósticos excluídos: ${deletedDiagnoses.count}`);
      
      // 10. Excluir consultas/atendimentos
      const deletedEncounters = await prisma.clinical_encounter.deleteMany({
        where: { medical_record_id: medicalRecordId }
      });
      console.log(`Consultas excluídas: ${deletedEncounters.count}`);
      
      // 11. Excluir o prontuário médico
      await prisma.medical_record.delete({
        where: { id: medicalRecordId }
      });
      console.log(`Prontuário médico excluído: ${medicalRecordId}`);
    } else {
      console.log(`Nenhum prontuário médico encontrado para o perfil ${profileId}`);
    }
    
    // 12. Excluir telefones do perfil
    const deletedPhones = await prisma.profile_phone.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Telefones excluídos: ${deletedPhones.count}`);
    
    // 13. Excluir emails do perfil
    const deletedEmails = await prisma.profile_email.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Emails excluídos: ${deletedEmails.count}`);
    
    // 14. Excluir endereços do perfil
    const deletedAddresses = await prisma.profile_address.deleteMany({
      where: { profile_id: profileId }
    });
    console.log(`Endereços excluídos: ${deletedAddresses.count}`);
    
    // 15. Excluir o perfil
    await prisma.profile.delete({
      where: { id: profileId }
    });
    console.log(`Perfil excluído: ${profileId}`);
    
    // 16. Excluir o usuário
    await prisma.user.delete({
      where: { id: patientId }
    });
    console.log(`Usuário excluído: ${patientId}`);
    
    console.log(`Paciente ${patientId} excluído com sucesso!`);
  } catch (error) {
    console.error(`Erro ao excluir paciente ${patientId}:`, error);
  }
}

async function main() {
  try {
    // Encontrar todos os usuários com role PATIENT, exceto o de email patient@agendasaude.com
    const patientsToDelete = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        email: {
          not: 'patient@agendasaude.com'
        }
      }
    });
    
    console.log(`Encontrados ${patientsToDelete.length} pacientes para excluir.`);
    
    // Excluir cada paciente
    for (const patient of patientsToDelete) {
      await deletePatient(patient.id);
    }
    
    console.log('Processo de limpeza concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
