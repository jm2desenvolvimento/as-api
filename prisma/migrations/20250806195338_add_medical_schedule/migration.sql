-- CreateEnum
CREATE TYPE "MedicalScheduleStatus" AS ENUM ('pending', 'confirmed', 'temporary', 'cancelled');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('none', 'daily', 'weekly', 'monthly');

-- CreateTable
CREATE TABLE "medical_schedule" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "health_unit_id" UUID NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "status" "MedicalScheduleStatus" NOT NULL DEFAULT 'pending',
    "total_slots" INTEGER NOT NULL,
    "available_slots" INTEGER NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_type" "RecurrenceType" DEFAULT 'none',
    "recurrence_end_date" TIMESTAMP(3),
    "recurrence_weekdays" TEXT,
    "substitute_doctor_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_schedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medical_schedule" ADD CONSTRAINT "medical_schedule_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_schedule" ADD CONSTRAINT "medical_schedule_health_unit_id_fkey" FOREIGN KEY ("health_unit_id") REFERENCES "health_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_schedule" ADD CONSTRAINT "medical_schedule_substitute_doctor_id_fkey" FOREIGN KEY ("substitute_doctor_id") REFERENCES "profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
