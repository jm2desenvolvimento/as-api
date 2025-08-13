/*
  Warnings:

  - Added the required column `specialty` to the `profile_doctor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "medical_schedule" ADD COLUMN     "exdates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rrule" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
-- ✅ ADICIONAR CAMPO COM VALOR PADRÃO PARA REGISTROS EXISTENTES
ALTER TABLE "profile_doctor" ADD COLUMN     "specialty" TEXT NOT NULL DEFAULT 'Clínico Geral';

-- ✅ REMOVER O VALOR PADRÃO APÓS A MIGRAÇÃO
ALTER TABLE "profile_doctor" ALTER COLUMN "specialty" DROP DEFAULT;
