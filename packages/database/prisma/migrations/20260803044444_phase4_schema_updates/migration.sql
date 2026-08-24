/*
  Warnings:

  - You are about to drop the column `phashBits` on the `subjects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attestations" ADD COLUMN     "payload_b64" TEXT;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN IF EXISTS "phashBits";

-- CreateTable
CREATE TABLE "proof_perceptual_hashes" (
    "id" UUID NOT NULL,
    "proof_id" UUID NOT NULL,
    "anchor_fraction" DOUBLE PRECISION NOT NULL,
    "phash_bits" bit(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "proof_perceptual_hashes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proof_perceptual_hashes_proof_id_anchor_fraction_key" ON "proof_perceptual_hashes"("proof_id", "anchor_fraction");

-- CreateIndex
CREATE INDEX "proofs_content_hash_idx" ON "proofs"("content_hash");

-- AddForeignKey
ALTER TABLE "proof_perceptual_hashes" ADD CONSTRAINT "proof_perceptual_hashes_proof_id_fkey" FOREIGN KEY ("proof_id") REFERENCES "proofs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
