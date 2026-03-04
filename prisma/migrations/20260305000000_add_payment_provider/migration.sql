-- Add payment provider columns for dual-mode (Stripe + AbacatePay)
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT DEFAULT 'stripe';
ALTER TABLE "Purchase" ADD COLUMN IF NOT EXISTS "paymentExternalId" TEXT;

-- Backfill existing purchases with Stripe data
UPDATE "Purchase"
SET "paymentProvider" = 'stripe', "paymentExternalId" = "stripePaymentIntentId"
WHERE "stripePaymentIntentId" IS NOT NULL AND "paymentProvider" IS NULL;
