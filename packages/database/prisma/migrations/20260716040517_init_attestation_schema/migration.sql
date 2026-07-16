-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('creator', 'admin');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'revoked');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('active', 'expired', 'revoked', 'superseded');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewed', 'closed');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'business', 'elite', 'enterprise');

-- CreateEnum
CREATE TYPE "IdentityClass" AS ENUM ('PSEUDONYMOUS', 'VERIFIED_PERSON', 'ORGANIZATIONAL_ROLE');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('PROBATION', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'OTHER');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('PROVENANCE_FOUND', 'ARTIFACT_FLAG', 'CONTEXT_NOTE', 'CORROBORATION', 'CUSTODY_RECEIVED', 'CUSTODY_TRANSFERRED', 'CUSTODY_SEALED', 'INTEGRITY_VERIFIED', 'REDACTION_APPLIED');

-- CreateEnum
CREATE TYPE "AttestationDomain" AS ENUM ('PUBLIC', 'CIRCLE');

-- CreateEnum
CREATE TYPE "AttestationStatus" AS ENUM ('PENDING', 'CORROBORATED', 'DISPUTED', 'SETTLED_CORRECT', 'SETTLED_INCORRECT', 'MACHINE_VERIFIED');

-- CreateEnum
CREATE TYPE "ReputationEventType" AS ENUM ('SETTLEMENT_CORRECT', 'SETTLEMENT_INCORRECT', 'CANARY_PASS', 'CANARY_FAIL', 'VOUCH_SLASH_PROPAGATION', 'CORROBORATION_REWARD', 'DECAY', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CircleDeployment" AS ENUM ('SAAS', 'ON_PREM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'creator',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_reminder_count" INTEGER NOT NULL DEFAULT 0,
    "last_verification_reminder_sent_at" TIMESTAMP(3),
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "otp" VARCHAR(8),
    "otp_expires_at" TIMESTAMP(3),
    "failed_otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "otp_locked_until" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_activity_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "handle" CITEXT NOT NULL,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "featured_video_id" UUID,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "appearance" JSONB DEFAULT '{}',
    "last_handle_change" TIMESTAMP(3),
    "custom_domain" TEXT,
    "last_domain_change" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "custom_image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "access_token_enc" BYTEA,
    "refresh_token_enc" BYTEA,
    "token_expiry" TIMESTAMP(3),
    "scope" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signing_keys" (
    "id" TEXT NOT NULL,
    "alg" TEXT NOT NULL DEFAULT 'Ed25519',
    "public_key_b64" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retired_at" TIMESTAMP(3),

    CONSTRAINT "signing_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'youtube',
    "platform_id" TEXT NOT NULL DEFAULT '',
    "channel_handle" TEXT,
    "channel_name" TEXT NOT NULL,
    "channel_url" TEXT,
    "avatar_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "verification_method" TEXT,
    "verification_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'youtube',
    "platform_id" TEXT NOT NULL DEFAULT '',
    "title" TEXT,
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "published_at" TIMESTAMP(3),
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proofs" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "alg" TEXT NOT NULL DEFAULT 'Ed25519',
    "kid" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "payload_b64" TEXT NOT NULL,
    "signature_b64" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'active',
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "content_hash" TEXT,
    "supersedes_proof_id" UUID,
    "superseded_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'free',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "videos_this_month" INTEGER NOT NULL DEFAULT 0,
    "api_calls_this_month" INTEGER NOT NULL DEFAULT 0,
    "usage_period_start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "last_used" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "channel_id" UUID,
    "video_id" UUID,
    "proof_id" UUID,
    "reporter_ip_hash" BYTEA,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transparency_log" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparency_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "http_logs" (
    "id" UUID NOT NULL,
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

-- CreateTable
CREATE TABLE "analytics_events" (
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
    "scroll_depth" INTEGER,
    "session_duration" INTEGER,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_queue" (
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

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "max_redemptions" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "stripe_coupon_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" UUID NOT NULL,
    "coupon_id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "email_sent_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_flags" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "user_id" UUID,
    "ip_hash" BYTEA,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_contexts" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "approved_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "audience_segment" TEXT NOT NULL,
    "custom_emails" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "html_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_sink_configs" (
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

-- CreateTable
CREATE TABLE "verifier_identities" (
    "id" UUID NOT NULL,
    "keyId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "identityClass" "IdentityClass" NOT NULL DEFAULT 'PSEUDONYMOUS',
    "status" "IdentityStatus" NOT NULL DEFAULT 'PROBATION',
    "displayHandle" TEXT,
    "platform" TEXT NOT NULL,
    "deviceAttested" BOOLEAN NOT NULL DEFAULT false,
    "reputation" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "accuracyScore" DOUBLE PRECISION,
    "attestationCount" INTEGER NOT NULL DEFAULT 0,
    "settledCorrect" INTEGER NOT NULL DEFAULT 0,
    "settledIncorrect" INTEGER NOT NULL DEFAULT 0,
    "lastDecayAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifier_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouches" (
    "id" UUID NOT NULL,
    "voucherId" UUID NOT NULL,
    "voucheeId" UUID NOT NULL,
    "stakeAmount" DOUBLE PRECISION NOT NULL,
    "signature" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "perceptualHash" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "sizeBytes" BIGINT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attestationCount" INTEGER NOT NULL DEFAULT 0,
    "verdictSummary" JSONB,
    "checkCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" UUID NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "claimType" "ClaimType" NOT NULL,
    "claimPayload" JSONB,
    "encryptedPayload" BYTEA,
    "attesterId" UUID NOT NULL,
    "domain" "AttestationDomain" NOT NULL DEFAULT 'PUBLIC',
    "circleId" UUID,
    "roleCertId" UUID,
    "priorId" UUID,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nonce" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "AttestationStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "weightAtAggregation" DOUBLE PRECISION,

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_events" (
    "id" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "type" "ReputationEventType" NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "reputationAfter" DOUBLE PRECISION NOT NULL,
    "attestationId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canary_tasks" (
    "id" UUID NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "groundTruth" JSONB NOT NULL,
    "sourceConsent" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "servedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canary_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canary_responses" (
    "id" UUID NOT NULL,
    "canaryId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "claimEcho" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canary_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correlation_clusters" (
    "id" UUID NOT NULL,
    "memberIds" TEXT[],
    "signals" JSONB NOT NULL,
    "discountFactor" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correlation_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rootPublicKey" TEXT NOT NULL,
    "deployment" "CircleDeployment" NOT NULL DEFAULT 'SAAS',
    "publicIdentity" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_certificates" (
    "id" UUID NOT NULL,
    "serial" TEXT NOT NULL,
    "circleId" UUID NOT NULL,
    "identityId" UUID NOT NULL,
    "roleName" TEXT NOT NULL,
    "allowedClaims" "ClaimType"[],
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "certBody" JSONB NOT NULL,
    "rootSignature" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationId" UUID,

    CONSTRAINT "role_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revocations" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "certSerials" TEXT[],
    "reason" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "rootSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tlog_entries" (
    "id" UUID NOT NULL,
    "seqIndex" BIGINT NOT NULL,
    "leafHash" TEXT NOT NULL,
    "attestationId" UUID,
    "isOpaque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tlog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merkle_checkpoints" (
    "id" UUID NOT NULL,
    "treeSize" BIGINT NOT NULL,
    "rootHash" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "rfc3161Token" BYTEA,
    "witnessCosigs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "merkle_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "auth_activity_logs_email_idx" ON "auth_activity_logs"("email");

-- CreateIndex
CREATE INDEX "auth_activity_logs_ip_address_idx" ON "auth_activity_logs"("ip_address");

-- CreateIndex
CREATE INDEX "auth_activity_logs_created_at_idx" ON "auth_activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_user_id_key" ON "creator_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_handle_key" ON "creator_profiles"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profiles_custom_domain_key" ON "creator_profiles"("custom_domain");

-- CreateIndex
CREATE INDEX "creator_profiles_handle_idx" ON "creator_profiles"("handle");

-- CreateIndex
CREATE INDEX "creator_links_user_id_sort_order_idx" ON "creator_links"("user_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_user_id_provider_key" ON "oauth_accounts"("user_id", "provider");

-- CreateIndex
CREATE INDEX "signing_keys_is_active_idx" ON "signing_keys"("is_active");

-- CreateIndex
CREATE INDEX "channels_user_id_idx" ON "channels"("user_id");

-- CreateIndex
CREATE INDEX "channels_verification_status_idx" ON "channels"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "channels_user_id_platform_platform_id_key" ON "channels"("user_id", "platform", "platform_id");

-- CreateIndex
CREATE INDEX "videos_channel_id_idx" ON "videos"("channel_id");

-- CreateIndex
CREATE INDEX "videos_published_at_idx" ON "videos"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "proofs_supersedes_proof_id_key" ON "proofs"("supersedes_proof_id");

-- CreateIndex
CREATE INDEX "proofs_video_id_idx" ON "proofs"("video_id");

-- CreateIndex
CREATE INDEX "proofs_channel_id_idx" ON "proofs"("channel_id");

-- CreateIndex
CREATE INDEX "proofs_status_expires_at_idx" ON "proofs"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_status_created_at_idx" ON "reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "transparency_log_entity_type_entity_id_idx" ON "transparency_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "transparency_log_event_time_idx" ON "transparency_log"("event_time" DESC);

-- CreateIndex
CREATE INDEX "http_logs_timestamp_idx" ON "http_logs"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "http_logs_status_code_timestamp_idx" ON "http_logs"("status_code", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "http_logs_method_timestamp_idx" ON "http_logs"("method", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "http_logs_user_id_timestamp_idx" ON "http_logs"("user_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "http_logs_ip_address_timestamp_idx" ON "http_logs"("ip_address", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "http_logs_path_timestamp_idx" ON "http_logs"("path", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "analytics_events_creator_id_created_at_idx" ON "analytics_events"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_type_created_at_idx" ON "analytics_events"("type", "created_at");

-- CreateIndex
CREATE INDEX "moderation_queue_status_created_at_idx" ON "moderation_queue"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_alerts_type_created_at_idx" ON "system_alerts"("type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_alerts_read_at_idx" ON "system_alerts"("read_at");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_expires_at_idx" ON "coupons"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_idx" ON "coupon_redemptions"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_user_id_idx" ON "coupon_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_source_idx" ON "coupon_redemptions"("source");

-- CreateIndex
CREATE INDEX "content_flags_video_id_idx" ON "content_flags"("video_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_contexts_video_id_key" ON "video_contexts"("video_id");

-- CreateIndex
CREATE INDEX "email_campaigns_status_idx" ON "email_campaigns"("status");

-- CreateIndex
CREATE INDEX "email_campaigns_scheduled_at_idx" ON "email_campaigns"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE INDEX "email_events_campaign_id_idx" ON "email_events"("campaign_id");

-- CreateIndex
CREATE INDEX "email_events_user_id_idx" ON "email_events"("user_id");

-- CreateIndex
CREATE INDEX "email_events_email_idx" ON "email_events"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verifier_identities_keyId_key" ON "verifier_identities"("keyId");

-- CreateIndex
CREATE UNIQUE INDEX "verifier_identities_publicKey_key" ON "verifier_identities"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "verifier_identities_displayHandle_key" ON "verifier_identities"("displayHandle");

-- CreateIndex
CREATE INDEX "verifier_identities_status_reputation_idx" ON "verifier_identities"("status", "reputation");

-- CreateIndex
CREATE UNIQUE INDEX "vouches_voucheeId_key" ON "vouches"("voucheeId");

-- CreateIndex
CREATE INDEX "vouches_voucherId_idx" ON "vouches"("voucherId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_hash_key" ON "subjects"("hash");

-- CreateIndex
CREATE INDEX "subjects_perceptualHash_idx" ON "subjects"("perceptualHash");

-- CreateIndex
CREATE INDEX "subjects_checkCount_firstSeenAt_idx" ON "subjects"("checkCount", "firstSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_payloadHash_key" ON "attestations"("payloadHash");

-- CreateIndex
CREATE INDEX "attestations_subjectId_domain_status_idx" ON "attestations"("subjectId", "domain", "status");

-- CreateIndex
CREATE INDEX "attestations_attesterId_receivedAt_idx" ON "attestations"("attesterId", "receivedAt");

-- CreateIndex
CREATE INDEX "attestations_circleId_receivedAt_idx" ON "attestations"("circleId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_attesterId_subjectId_claimType_nonce_key" ON "attestations"("attesterId", "subjectId", "claimType", "nonce");

-- CreateIndex
CREATE INDEX "reputation_events_identityId_createdAt_idx" ON "reputation_events"("identityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "canary_tasks_subjectHash_key" ON "canary_tasks"("subjectHash");

-- CreateIndex
CREATE INDEX "canary_responses_identityId_createdAt_idx" ON "canary_responses"("identityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "canary_responses_canaryId_identityId_key" ON "canary_responses"("canaryId", "identityId");

-- CreateIndex
CREATE INDEX "correlation_clusters_expiresAt_idx" ON "correlation_clusters"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "circles_slug_key" ON "circles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "circles_rootPublicKey_key" ON "circles"("rootPublicKey");

-- CreateIndex
CREATE UNIQUE INDEX "role_certificates_serial_key" ON "role_certificates"("serial");

-- CreateIndex
CREATE INDEX "role_certificates_circleId_identityId_idx" ON "role_certificates"("circleId", "identityId");

-- CreateIndex
CREATE INDEX "role_certificates_validFrom_validUntil_idx" ON "role_certificates"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "tlog_entries_seqIndex_key" ON "tlog_entries"("seqIndex");

-- CreateIndex
CREATE UNIQUE INDEX "tlog_entries_leafHash_key" ON "tlog_entries"("leafHash");

-- CreateIndex
CREATE UNIQUE INDEX "tlog_entries_attestationId_key" ON "tlog_entries"("attestationId");

-- CreateIndex
CREATE UNIQUE INDEX "merkle_checkpoints_treeSize_key" ON "merkle_checkpoints"("treeSize");

-- AddForeignKey
ALTER TABLE "auth_activity_logs" ADD CONSTRAINT "auth_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_featured_video_id_fkey" FOREIGN KEY ("featured_video_id") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_links" ADD CONSTRAINT "creator_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_kid_fkey" FOREIGN KEY ("kid") REFERENCES "signing_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_supersedes_proof_id_fkey" FOREIGN KEY ("supersedes_proof_id") REFERENCES "proofs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_proof_id_fkey" FOREIGN KEY ("proof_id") REFERENCES "proofs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_contexts" ADD CONSTRAINT "video_contexts_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_voucheeId_fkey" FOREIGN KEY ("voucheeId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_attesterId_fkey" FOREIGN KEY ("attesterId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_roleCertId_fkey" FOREIGN KEY ("roleCertId") REFERENCES "role_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_priorId_fkey" FOREIGN KEY ("priorId") REFERENCES "attestations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_events" ADD CONSTRAINT "reputation_events_attestationId_fkey" FOREIGN KEY ("attestationId") REFERENCES "attestations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canary_responses" ADD CONSTRAINT "canary_responses_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "canary_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canary_responses" ADD CONSTRAINT "canary_responses_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_certificates" ADD CONSTRAINT "role_certificates_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_certificates" ADD CONSTRAINT "role_certificates_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "verifier_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_certificates" ADD CONSTRAINT "role_certificates_revocationId_fkey" FOREIGN KEY ("revocationId") REFERENCES "revocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revocations" ADD CONSTRAINT "revocations_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tlog_entries" ADD CONSTRAINT "tlog_entries_attestationId_fkey" FOREIGN KEY ("attestationId") REFERENCES "attestations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
