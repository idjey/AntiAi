/*
  Warnings:

  - You are about to alter the column `phashBits` on the `subjects` table. The data in that column could be lost. The data in that column will be cast from `Bit(64)` to `Unsupported("bit(64)")`.

*/
-- AlterTable
ALTER TABLE "canary_tasks" ADD COLUMN     "distributionChannel" TEXT,
ADD COLUMN     "licenseRef" TEXT,
ADD COLUMN     "storageUri" TEXT;

-- AlterTable
ALTER TABLE "subjects" ALTER COLUMN "phashBits" SET DATA TYPE bit(64);

-- CreateTable
CREATE TABLE "reputation_configs" (
    "id" SERIAL NOT NULL,
    "params" JSONB NOT NULL,
    "comment" TEXT NOT NULL,
    "activationRequestedBy" TEXT NOT NULL,
    "activationRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_verdict_diffs" (
    "id" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "configVersion" INTEGER NOT NULL,
    "baseline" JSONB NOT NULL,
    "weighted" JSONB NOT NULL,
    "divergence" JSONB NOT NULL,
    "flipped" BOOLEAN NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shadow_verdict_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_verdict_diffs_flipped_computedAt_idx" ON "shadow_verdict_diffs"("flipped", "computedAt");

-- CreateIndex
CREATE INDEX "shadow_verdict_diffs_subjectId_computedAt_idx" ON "shadow_verdict_diffs"("subjectId", "computedAt");
