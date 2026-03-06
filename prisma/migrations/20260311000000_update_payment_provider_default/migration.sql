-- AlterTable: change default payment provider from "stripe" to "abacatepay"
ALTER TABLE "Purchase" ALTER COLUMN "paymentProvider" SET DEFAULT 'abacatepay';
