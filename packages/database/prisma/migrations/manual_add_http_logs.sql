-- Create HTTP Logs table
CREATE TABLE IF NOT EXISTS "http_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" VARCHAR(10) NOT NULL,
    "path" TEXT NOT NULL,
    "route_pattern" TEXT,
    "query_string" TEXT,
    "request_content_length" INTEGER,
    "status_code" INTEGER NOT NULL,
    "response_content_length" INTEGER,
    "duration_ms" INTEGER NOT NULL,
    "error_message" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "origin" TEXT,
    "referer" TEXT,
    "user_id" UUID,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "correlation_id" UUID,

    CONSTRAINT "http_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "http_logs_timestamp_idx" ON "http_logs"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "http_logs_status_code_timestamp_idx" ON "http_logs"("status_code", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "http_logs_method_timestamp_idx" ON "http_logs"("method", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "http_logs_user_id_timestamp_idx" ON "http_logs"("user_id", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "http_logs_ip_address_timestamp_idx" ON "http_logs"("ip_address", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "http_logs_path_timestamp_idx" ON "http_logs"("path", "timestamp" DESC);
