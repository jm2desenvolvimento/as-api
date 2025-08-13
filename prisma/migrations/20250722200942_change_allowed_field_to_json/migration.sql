/*
  Warnings:

  - The `allowed` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "allowed",
ADD COLUMN     "allowed" JSONB NOT NULL DEFAULT '{}';
