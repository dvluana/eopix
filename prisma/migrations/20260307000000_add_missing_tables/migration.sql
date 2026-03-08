-- CreateTable
CREATE TABLE IF NOT EXISTS "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT,
    "purchaseCode" TEXT,
    "term" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "requestBody" JSONB,
    "responseRaw" JSONB NOT NULL,
    "responseTime" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LgpdRequest" (
    "id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LgpdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiRequestLog_purchaseCode_idx" ON "ApiRequestLog"("purchaseCode");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_term_type_idx" ON "ApiRequestLog"("term", "type");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_source_idx" ON "ApiRequestLog"("source");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LgpdRequest_protocol_key" ON "LgpdRequest"("protocol");
CREATE INDEX IF NOT EXISTS "LgpdRequest_protocol_idx" ON "LgpdRequest"("protocol");
CREATE INDEX IF NOT EXISTS "LgpdRequest_cpfCnpj_idx" ON "LgpdRequest"("cpfCnpj");
