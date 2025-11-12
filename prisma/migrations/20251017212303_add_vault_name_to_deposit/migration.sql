-- AlterTable
ALTER TABLE "Deposit" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "vaultName" TEXT;
