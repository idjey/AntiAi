-- Add schemaVersion and contentHash to proofs
ALTER TABLE "proofs" ADD COLUMN "schema_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "proofs" ADD COLUMN "content_hash" TEXT;

-- Add ipHash to content_flags
ALTER TABLE "content_flags" ADD COLUMN "ip_hash" BYTEA;

-- 2. Add the partial unique index: one active proof per video
CREATE UNIQUE INDEX "one_active_proof_per_video" ON "proofs" ("video_id") WHERE status = 'active';

-- 9. Make TransparencyLog append-only at DB level
CREATE RULE transparency_log_append_only AS ON UPDATE TO "transparency_log" DO INSTEAD NOTHING;
CREATE RULE transparency_log_no_delete AS ON DELETE TO "transparency_log" DO INSTEAD NOTHING;
