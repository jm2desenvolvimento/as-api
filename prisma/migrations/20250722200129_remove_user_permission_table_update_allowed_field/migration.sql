/*
  Warnings:

  - The `allowed` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `user_permission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_permission" DROP CONSTRAINT "user_permission_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "user_permission" DROP CONSTRAINT "user_permission_user_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "allowed",
ADD COLUMN     "allowed" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "user_permission";
