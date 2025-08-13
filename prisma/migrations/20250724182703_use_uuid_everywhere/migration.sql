/*
  Warnings:

  - The primary key for the `city_hall` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `city_hall` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `city_hall_id` on the `health_unit` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "health_unit" DROP CONSTRAINT "health_unit_city_hall_id_fkey";

-- AlterTable
ALTER TABLE "city_hall" DROP CONSTRAINT "city_hall_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "city_hall_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "health_unit" DROP COLUMN "city_hall_id",
ADD COLUMN     "city_hall_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "health_unit" ADD CONSTRAINT "health_unit_city_hall_id_fkey" FOREIGN KEY ("city_hall_id") REFERENCES "city_hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
