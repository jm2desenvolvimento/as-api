/*
  Warnings:

  - The `uploaded_by` column on the `document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `requested_by` column on the `exam` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `prescribed_by` column on the `medication` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `doctor_id` on the `consultation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "consultation" DROP CONSTRAINT IF EXISTS "consultation_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT IF EXISTS "document_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "exam" DROP CONSTRAINT IF EXISTS "exam_requested_by_fkey";

-- DropForeignKey
ALTER TABLE "medical_schedule" DROP CONSTRAINT IF EXISTS "medical_schedule_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "medical_schedule" DROP CONSTRAINT IF EXISTS "medical_schedule_substitute_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "medication" DROP CONSTRAINT IF EXISTS "medication_prescribed_by_fkey";

-- AlterTable: Convert doctor_id from text to UUID with data preservation
ALTER TABLE "consultation" 
ADD COLUMN "doctor_id_new" UUID;

-- Update the new column with converted data (assuming existing data is valid UUID format)
UPDATE "consultation" 
SET "doctor_id_new" = "doctor_id"::UUID 
WHERE "doctor_id" IS NOT NULL AND "doctor_id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Drop old column and rename new one
ALTER TABLE "consultation" DROP COLUMN "doctor_id";
ALTER TABLE "consultation" RENAME COLUMN "doctor_id_new" TO "doctor_id";
ALTER TABLE "consultation" ALTER COLUMN "doctor_id" SET NOT NULL;

-- AlterTable: Convert uploaded_by from text to UUID with data preservation
ALTER TABLE "document" 
ADD COLUMN "uploaded_by_new" UUID;

UPDATE "document" 
SET "uploaded_by_new" = "uploaded_by"::UUID 
WHERE "uploaded_by" IS NOT NULL AND "uploaded_by" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "document" DROP COLUMN "uploaded_by";
ALTER TABLE "document" RENAME COLUMN "uploaded_by_new" TO "uploaded_by";

-- AlterTable: Convert requested_by from text to UUID with data preservation
ALTER TABLE "exam" 
ADD COLUMN "requested_by_new" UUID;

UPDATE "exam" 
SET "requested_by_new" = "requested_by"::UUID 
WHERE "requested_by" IS NOT NULL AND "requested_by" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "exam" DROP COLUMN "requested_by";
ALTER TABLE "exam" RENAME COLUMN "requested_by_new" TO "requested_by";

-- AlterTable: Convert prescribed_by from text to UUID with data preservation
ALTER TABLE "medication" 
ADD COLUMN "prescribed_by_new" UUID;

UPDATE "medication" 
SET "prescribed_by_new" = "prescribed_by"::UUID 
WHERE "prescribed_by" IS NOT NULL AND "prescribed_by" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "medication" DROP COLUMN "prescribed_by";
ALTER TABLE "medication" RENAME COLUMN "prescribed_by_new" TO "prescribed_by";

-- AlterTable: Convert medical_schedule doctor_id from text to UUID with data preservation
ALTER TABLE "medical_schedule" 
ADD COLUMN "doctor_id_new" UUID;

UPDATE "medical_schedule" 
SET "doctor_id_new" = "doctor_id"::UUID 
WHERE "doctor_id" IS NOT NULL AND "doctor_id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "medical_schedule" DROP COLUMN "doctor_id";
ALTER TABLE "medical_schedule" RENAME COLUMN "doctor_id_new" TO "doctor_id";
ALTER TABLE "medical_schedule" ALTER COLUMN "doctor_id" SET NOT NULL;

-- AlterTable: Convert substitute_doctor_id from text to UUID with data preservation
ALTER TABLE "medical_schedule" 
ADD COLUMN "substitute_doctor_id_new" UUID;

UPDATE "medical_schedule" 
SET "substitute_doctor_id_new" = "substitute_doctor_id"::UUID 
WHERE "substitute_doctor_id" IS NOT NULL AND "substitute_doctor_id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

ALTER TABLE "medical_schedule" DROP COLUMN "substitute_doctor_id";
ALTER TABLE "medical_schedule" RENAME COLUMN "substitute_doctor_id_new" TO "substitute_doctor_id";

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication" ADD CONSTRAINT "medication_prescribed_by_fkey" FOREIGN KEY ("prescribed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam" ADD CONSTRAINT "exam_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_schedule" ADD CONSTRAINT "medical_schedule_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_schedule" ADD CONSTRAINT "medical_schedule_substitute_doctor_id_fkey" FOREIGN KEY ("substitute_doctor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
