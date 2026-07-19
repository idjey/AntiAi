/*
  Warnings:

  - You are about to alter the column `phashBits` on the `subjects` table. The data in that column could be lost. The data in that column will be cast from `Bit(64)` to `Unsupported("bit(64)")`.

*/
-- AlterTable
ALTER TABLE "subjects" ALTER COLUMN "phashBits" SET DATA TYPE bit(64);

-- AlterTable
ALTER TABLE "verifier_identities" ADD COLUMN     "canaryDownweighted" BOOLEAN NOT NULL DEFAULT false;
