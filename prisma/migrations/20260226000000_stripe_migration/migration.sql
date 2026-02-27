-- Step 1: Rename asaasPaymentId -> stripePaymentIntentId
DROP INDEX IF EXISTS "Purchase_asaasPaymentId_key";
ALTER TABLE "Purchase" RENAME COLUMN "asaasPaymentId" TO "stripePaymentIntentId";
CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_stripePaymentIntentId_key" ON "Purchase"("stripePaymentIntentId");

-- Step 2: Drop asaasInvoiceId (develop only)
DROP INDEX IF EXISTS "Purchase_asaasInvoiceId_key";
ALTER TABLE "Purchase" DROP COLUMN IF EXISTS "asaasInvoiceId";

-- Step 3: Add missing columns
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "processingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "refundAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "failureDetails" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "refundDetails" TEXT;

-- Step 4: Create AdminUser table
CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
