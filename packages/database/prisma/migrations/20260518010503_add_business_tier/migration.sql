ALTER TYPE "PlanTier" ADD VALUE 'business';
CREATE UNIQUE INDEX IF NOT EXISTS one_active_proof_per_video ON proofs (video_id) WHERE status = 'active';
