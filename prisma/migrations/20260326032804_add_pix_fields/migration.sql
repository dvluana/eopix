-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "pixBrCode" TEXT,
ADD COLUMN     "pixBrCodeBase64" TEXT,
ADD COLUMN     "pixExpiresAt" TIMESTAMP(3);
