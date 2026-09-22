-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "vehicleType" TEXT,
    "zone" TEXT,
    "probleme" TEXT,
    "difficulte" TEXT,
    "interet" TEXT,
    "telephone" TEXT,
    "mobileMoney" TEXT,
    "recontact" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Response_role_idx" ON "Response"("role");

-- CreateIndex
CREATE INDEX "Response_createdAt_idx" ON "Response"("createdAt");

