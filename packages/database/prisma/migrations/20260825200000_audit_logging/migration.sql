-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "organization_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "audit_logs" ALTER COLUMN "organization_id" DROP DEFAULT;
ALTER TABLE "audit_logs" ADD COLUMN "previous_hash" TEXT NOT NULL DEFAULT 'GENESIS';
ALTER TABLE "audit_logs" ALTER COLUMN "previous_hash" DROP DEFAULT;
ALTER TABLE "audit_logs" ADD COLUMN "hash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "audit_logs" ALTER COLUMN "hash" DROP DEFAULT;

-- CreateTable
CREATE TABLE "audit_checkpoints" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "last_entry_id" BIGINT NOT NULL,
    "head_hash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_hash_key" ON "audit_logs"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "audit_logs_organization_id_previous_hash_key" ON "audit_logs"("organization_id", "previous_hash");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_checkpoints_organization_id_created_at_idx" ON "audit_checkpoints"("organization_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_checkpoints" ADD CONSTRAINT "audit_checkpoints_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
