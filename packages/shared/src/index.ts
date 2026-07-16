// ==================== PLAN LIMITS (Single Source of Truth) ====================

export type PlanTier = 'free' | 'pro' | 'business' | 'elite' | 'enterprise';

export interface PlanLimits {
    videosPerMonth: number;        // -1 = unlimited
    shopProducts: number;          // -1 = unlimited
    apiCallsPerMonth: number;      // -1 = unlimited
    customDomain: boolean;
    whiteLabelBadge: boolean;
    analyticsAccess: boolean;
    customHandle: boolean;
    customBackgrounds: boolean;
    transparencyLogExport: boolean;
    featuredInDirectory: boolean;  // Added for Creator Directory feature
    proofExpiryDays: number;       // How long issued proofs remain active
}

export const PLAN_LIMITS_CONFIG: Record<PlanTier, PlanLimits> = {
    free: {
        videosPerMonth: 5,
        shopProducts: 1,
        apiCallsPerMonth: 0,
        customDomain: false,
        whiteLabelBadge: false,
        analyticsAccess: false,
        customHandle: false,
        customBackgrounds: false,
        transparencyLogExport: false,
        featuredInDirectory: false,
        proofExpiryDays: 90,
    },
    pro: {
        videosPerMonth: 100,
        shopProducts: -1,
        apiCallsPerMonth: 0,
        customDomain: false,
        whiteLabelBadge: false,
        analyticsAccess: true,
        customHandle: true,
        customBackgrounds: true,
        transparencyLogExport: false,
        featuredInDirectory: false,
        proofExpiryDays: 365,
    },
    business: {
        videosPerMonth: 500,
        shopProducts: -1,
        apiCallsPerMonth: 10_000,
        customDomain: true,
        whiteLabelBadge: false,
        analyticsAccess: true,
        customHandle: true,
        customBackgrounds: true,
        transparencyLogExport: false,
        featuredInDirectory: false,
        proofExpiryDays: 365,
    },
    elite: {
        videosPerMonth: -1,
        shopProducts: -1,
        apiCallsPerMonth: -1,
        customDomain: true,
        whiteLabelBadge: true,
        analyticsAccess: true,
        customHandle: true,
        customBackgrounds: true,
        transparencyLogExport: true,
        featuredInDirectory: true,
        proofExpiryDays: 365,
    },
    enterprise: {
        videosPerMonth: -1,
        shopProducts: -1,
        apiCallsPerMonth: -1,
        customDomain: true,
        whiteLabelBadge: true,
        analyticsAccess: true,
        customHandle: true,
        customBackgrounds: true,
        transparencyLogExport: true,
        featuredInDirectory: true,
        proofExpiryDays: 365,
    },
};

/**
 * Returns the plan limits for a given tier.
 * Falls back to free limits if tier is unrecognised.
 */
export function getPlanLimits(tier: PlanTier | string): PlanLimits {
    return PLAN_LIMITS_CONFIG[tier as PlanTier] ?? PLAN_LIMITS_CONFIG.free;
}

// Legacy compatibility: simple video limit lookup
export const PLAN_LIMITS: Record<string, number> = {
    free: 5,
    pro: 100,
    business: 500,
    elite: Infinity,
    enterprise: Infinity,
} as const;

export const PRODUCT_LIMITS: Record<string, number> = {
    free: 1,
    pro: Infinity,
    business: Infinity,
    elite: Infinity,
    enterprise: Infinity,
} as const;

export const PROOF_DEFAULT_EXPIRY_DAYS = 90;

// ==================== API TYPES ====================

// Auth
export interface SignupRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthTokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
}

export interface MeResponse {
    id: string;
    email: string;
    role: 'creator' | 'admin';
}

// Channels
export interface Channel {
    id: string;
    youtube_channel_id: string;
    channel_handle: string | null;
    channel_name: string;
    channel_url: string | null;
    avatar_url: string | null;
    verification_status: 'pending' | 'verified' | 'revoked';
    verified_at: string | null;
}

export interface ChannelVerifyStartRequest {
    youtube_channel_id: string;
    method: 'oauth' | 'about_token' | 'video_token' | 'pinned_comment';
    requested_handle?: string;
}

export interface ChannelVerifyStartResponse {
    channel_id: string;
    method: string;
    token: string | null;
    instructions: string | null;
    token_expires_at: string;
}

// Videos
export interface Video {
    id: string;
    channel_id: string;
    youtube_video_id: string;
    title: string | null;
    video_url: string | null;
    published_at: string | null;
}

export interface VideoImportRequest {
    video_url: string;
    channel_id?: string;
}

// Proofs
export interface Proof {
    id: string;
    video_id: string;
    channel_id: string;
    alg: 'Ed25519';
    kid: string;
    payload_json: Record<string, unknown>;
    payload_b64: string;
    signature_b64: string;
    issued_at: string;
    expires_at: string;
    status: 'active' | 'expired' | 'revoked' | 'superseded';
    supersedes_proof_id: string | null;
    superseded_at: string | null;
    revoked_at: string | null;
    revoke_reason: string | null;
}

export interface ProofIssueRequest {
    video_id: string;
    // expires_at is now server-computed from plan limits — never client-supplied
}

export interface ProofReissueRequest {
    video_id: string;
    // expires_at is now server-computed from plan limits — never client-supplied
    reason: 'extend_expiry' | 'key_rotation' | 'security_incident';
    note?: string;
}

// Public API
export interface PublicVerifyResponse {
    status: 'verified' | 'unverified' | 'revoked' | 'expired';
    youtube_video_id: string;
    youtube_channel_id: string | null;
    channel_name: string | null;
    channel_handle: string | null;
    proof: Proof | null;
    public_creator_url: string | null;
    message: string | null;
}

export interface PublicProofResponse {
    alg: 'Ed25519';
    kid: string;
    payload_b64: string;
    signature_b64: string;
    expires_at: string;
}

export interface SigningKey {
    kid: string;
    alg: 'Ed25519';
    public_key_b64: string;
}

// Billing
export interface BillingCheckoutRequest {
    plan: 'pro' | 'business' | 'elite';
    success_url: string;
    cancel_url: string;
}

export interface BillingStatusResponse {
    plan: 'free' | 'pro' | 'business' | 'elite';
    status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired';
    current_period_end: string | null;
    videos_used: number;
    videos_limit: number;
}

// Error
export interface ApiError {
    error: string;
    message: string;
    details?: Record<string, unknown>;
}
