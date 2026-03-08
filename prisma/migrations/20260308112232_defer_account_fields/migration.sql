-- AlterTable
ALTER TABLE "LeadCapture" ADD COLUMN     "buyerTaxId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "pendingPasswordHash" TEXT;
