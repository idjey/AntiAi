-- migration: add_phash_bits
ALTER TABLE "subjects"
  ADD COLUMN phash_bits BIT(64)
  GENERATED ALWAYS AS (
    CASE WHEN "perceptualHash" IS NOT NULL AND length("perceptualHash") = 16
         THEN ('x' || "perceptualHash")::bit(64)
         ELSE NULL END
  ) STORED;

CREATE INDEX subject_phash_notnull_idx ON "subjects" ("mediaType")
  WHERE phash_bits IS NOT NULL;
