-- Migration: Add missing columns and tables to sync schema

-- 1. Add is_suspended to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_suspended" BOOLEAN NOT NULL DEFAULT false;

-- 2. Add appearance to creator_profiles
ALTER TABLE "creator_profiles" ADD COLUMN IF NOT EXISTS "appearance" JSONB DEFAULT '{}';

-- 3. Add custom_image_url to creator_links
ALTER TABLE "creator_links" ADD COLUMN IF NOT EXISTS "custom_image_url" TEXT;

-- 4. Add interval to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "interval" TEXT NOT NULL DEFAULT 'month';

-- 5. Fix transparency_log: recreate with UUID id if needed (drop old BIGSERIAL version if it exists with wrong type)
-- We check if it needs fixing by attempting the column alter
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transparency_log' AND column_name = 'id' AND data_type = 'bigint'
  ) THEN
    -- Drop and recreate the table with UUID id
    DROP TABLE IF EXISTS "transparency_log";
    CREATE TABLE "transparency_log" (
      "id" UUID NOT NULL,
      "event_type" TEXT NOT NULL,
      "entity_type" TEXT NOT NULL,
      "entity_id" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT "transparency_log_pkey" PRIMARY KEY ("id")
    );

    CREATE INDEX "transparency_log_entity_type_entity_id_idx" ON "transparency_log"("entity_type", "entity_id");
    CREATE INDEX "transparency_log_event_time_idx" ON "transparency_log"("event_time" DESC);
  END IF;
END
$$;

-- 6. Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT,
  "description" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- 7. Create analytics_events table
CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "entity_id" TEXT,
  "ip_hash" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "device" TEXT,
  "os" TEXT,
  "browser" TEXT,
  "referer" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_creator_id_created_at_idx" ON "analytics_events"("creator_id", "created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_type_created_at_idx" ON "analytics_events"("type", "created_at");

-- AddForeignKey for analytics_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'analytics_events_creator_id_fkey'
  ) THEN
    ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_creator_id_fkey"
      FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- 8. Create moderation_queue table
CREATE TABLE IF NOT EXISTS "moderation_queue" (
  "id" UUID NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewed_at" TIMESTAMP(3),
  "reviewed_by" UUID,

  CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "moderation_queue_status_created_at_idx" ON "moderation_queue"("status", "created_at" DESC);

-- AddForeignKey for moderation_queue reviewed_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'moderation_queue_reviewed_by_fkey'
  ) THEN
    ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
