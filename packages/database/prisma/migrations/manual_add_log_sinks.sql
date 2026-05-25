CREATE TABLE IF NOT EXISTS "log_sink_configs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT NOT NULL,
    "filterMethods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "filterMinStatus" INTEGER,
    "filterPaths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_forwarded_at" TIMESTAMP(3),
    "last_forwarded_id" TEXT,
    "last_error" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_sink_configs_pkey" PRIMARY KEY ("id")
);
