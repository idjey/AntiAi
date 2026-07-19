/*
  Warnings:

  - You are about to drop the column `phash_bits` on the `subjects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "phash_bits",
ADD COLUMN "phashBits" BIT(64) GENERATED ALWAYS AS (
  CASE WHEN "perceptualHash" IS NOT NULL AND length("perceptualHash") = 16
       THEN ('x' || "perceptualHash")::bit(64)
       ELSE NULL END
) STORED;
