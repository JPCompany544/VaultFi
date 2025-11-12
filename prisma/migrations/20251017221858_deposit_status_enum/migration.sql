/*
  Warnings:

  - The `status` column on the `Deposit` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('pending', 'confirmed');

-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "status",
ADD COLUMN     "status" "DepositStatus" NOT NULL DEFAULT 'pending';
