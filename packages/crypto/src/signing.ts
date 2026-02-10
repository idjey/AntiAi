/**
 * AntiAI.me Ed25519 Signing Module
 * 
 * Server-side signing using @noble/ed25519 + json-canonicalize
 * Based on the specification's canonical payload format
 */

import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { canonicalize } from 'json-canonicalize';
import { randomBytes } from 'crypto';

// Required for @noble/ed25519 v2
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// ==================== TYPES ====================

export interface ProofPayload {
    v: number;
    iss: string;
    kid: string;
    iat: number;
    exp: number;
    nonce: string;
    youtube_video_id: string;
    youtube_channel_id: string;
}

export interface SignedProof {
    alg: 'Ed25519';
    kid: string;
    payload_json: ProofPayload;
    payload_b64: string;
    signature_b64: string;
    issued_at_unix: number;
    expires_at_unix: number;
}

export interface KeyPair {
    privateKeyB64: string;
    publicKeyB64: string;
}

// ==================== BASE64 HELPERS ====================

function toBase64Url(bytes: Uint8Array): string {
    const b64 = Buffer.from(bytes).toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64(b64: string): Uint8Array {
    return new Uint8Array(Buffer.from(b64, 'base64'));
}

function fromBase64Url(b64url: string): Uint8Array {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
    return new Uint8Array(Buffer.from(b64, 'base64'));
}

function nowUnixSec(): number {
    return Math.floor(Date.now() / 1000);
}

function randomNonceB64Url(byteLen = 16): string {
    const buf = randomBytes(byteLen);
    return toBase64Url(buf);
}

// ==================== KEY GENERATION ====================

/**
 * Generate a new Ed25519 key pair for signing proofs
 */
export async function generateKeyPair(): Promise<KeyPair> {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);

    return {
        privateKeyB64: Buffer.from(privateKey).toString('base64'),
        publicKeyB64: Buffer.from(publicKey).toString('base64'),
    };
}

/**
 * Derive public key from private key
 */
export async function getPublicKey(privateKeyB64: string): Promise<string> {
    const privBytes = fromBase64(privateKeyB64);
    const priv32 = privBytes.length === 32 ? privBytes : privBytes.slice(0, 32);
    const publicKey = await ed25519.getPublicKeyAsync(priv32);
    return Buffer.from(publicKey).toString('base64');
}

// ==================== PAYLOAD BUILDING ====================

export interface BuildPayloadOptions {
    kid: string;
    youtubeVideoId: string;
    youtubeChannelId: string;
    expiresAtUnix: number;
}

/**
 * Build the canonical payload for signing
 */
export function buildCanonicalPayload(options: BuildPayloadOptions): {
    payload: ProofPayload;
    canonicalJson: string;
    payloadBytes: Uint8Array;
} {
    const { kid, youtubeVideoId, youtubeChannelId, expiresAtUnix } = options;

    if (!kid) throw new Error('kid is required');
    if (!youtubeVideoId) throw new Error('youtubeVideoId is required');
    if (!youtubeChannelId) throw new Error('youtubeChannelId is required');

    const iat = nowUnixSec();
    const exp = Number(expiresAtUnix);

    if (!Number.isFinite(exp)) throw new Error('expiresAtUnix must be a number');
    if (exp <= iat) throw new Error('exp must be > iat');

    // Minimal canonical payload fields per specification
    const payload: ProofPayload = {
        v: 1,
        iss: 'antiai.me',
        kid,
        iat,
        exp,
        nonce: randomNonceB64Url(16),
        youtube_video_id: youtubeVideoId,
        youtube_channel_id: youtubeChannelId,
    };

    // Canonical JSON string per JCS (stable key ordering, minimal formatting)
    const canonicalJson = canonicalize(payload);
    const payloadBytes = new TextEncoder().encode(canonicalJson);

    return { payload, canonicalJson, payloadBytes };
}

// ==================== SIGNING ====================

export interface SignProofOptions {
    kid: string;
    youtubeVideoId: string;
    youtubeChannelId: string;
    expiresAt: Date | number; // Date object or unix timestamp in ms
    privateKeyB64: string;
}

/**
 * Sign a proof for a video using Ed25519
 */
export async function signProof(options: SignProofOptions): Promise<SignedProof> {
    const { kid, youtubeVideoId, youtubeChannelId, expiresAt, privateKeyB64 } = options;

    if (!privateKeyB64) throw new Error('privateKeyB64 is required');

    // Normalize expiry to unix seconds
    let expiresAtUnix: number;
    if (expiresAt instanceof Date) {
        expiresAtUnix = Math.floor(expiresAt.getTime() / 1000);
    } else if (typeof expiresAt === 'number') {
        // Assume milliseconds if it looks like a JS timestamp
        expiresAtUnix = expiresAt > 10000000000 ? Math.floor(expiresAt / 1000) : expiresAt;
    } else {
        throw new Error('expiresAt must be Date or number');
    }

    const { payload, payloadBytes } = buildCanonicalPayload({
        kid,
        youtubeVideoId,
        youtubeChannelId,
        expiresAtUnix,
    });

    // Decode private key material
    const privBytes = fromBase64(privateKeyB64);
    // @noble/ed25519 expects 32-byte private key (seed)
    const priv32 = privBytes.length === 32 ? privBytes : privBytes.slice(0, 32);

    // Sign canonical payload bytes
    const sigBytes = await ed25519.signAsync(payloadBytes, priv32);

    // Produce base64url outputs
    const payload_b64 = toBase64Url(payloadBytes);
    const signature_b64 = toBase64Url(sigBytes);

    return {
        alg: 'Ed25519',
        kid,
        payload_json: payload,
        payload_b64,
        signature_b64,
        issued_at_unix: payload.iat,
        expires_at_unix: payload.exp,
    };
}

// ==================== VERIFICATION ====================

export interface VerifyResult {
    ok: boolean;
    status: 'verified' | 'unverified' | 'expired' | 'error';
    reason?: string;
    payload?: ProofPayload;
}

/**
 * Verify a proof signature and validate claims
 */
export async function verifyProof(options: {
    payload_b64: string;
    signature_b64: string;
    publicKeyB64: string;
    expectedVideoId?: string;
    expectedChannelId?: string;
}): Promise<VerifyResult> {
    const { payload_b64, signature_b64, publicKeyB64, expectedVideoId, expectedChannelId } = options;

    try {
        const payloadBytes = fromBase64Url(payload_b64);
        const sigBytes = fromBase64Url(signature_b64);
        const pubBytes = fromBase64(publicKeyB64);

        // Verify Ed25519 signature
        const signatureOk = await ed25519.verifyAsync(sigBytes, payloadBytes, pubBytes);
        if (!signatureOk) {
            return { ok: false, status: 'error', reason: 'bad_signature' };
        }

        // Parse payload
        const payloadStr = new TextDecoder().decode(payloadBytes);
        const payload: ProofPayload = JSON.parse(payloadStr);

        // Validate required fields
        if (payload.v !== 1) return { ok: false, status: 'error', reason: 'bad_version' };
        if (payload.iss !== 'antiai.me') return { ok: false, status: 'error', reason: 'bad_issuer' };

        // Check bindings
        if (expectedVideoId && payload.youtube_video_id !== expectedVideoId) {
            return { ok: false, status: 'error', reason: 'video_id_mismatch' };
        }
        if (expectedChannelId && payload.youtube_channel_id !== expectedChannelId) {
            return { ok: false, status: 'error', reason: 'channel_id_mismatch' };
        }

        // Time validity
        const nowSec = nowUnixSec();
        const SKEW_SEC = 5 * 60; // 5 minute clock skew allowance

        if (payload.iat > nowSec + SKEW_SEC) {
            return { ok: false, status: 'error', reason: 'iat_in_future' };
        }
        if (payload.exp <= nowSec - SKEW_SEC) {
            return { ok: false, status: 'expired', reason: 'proof_expired' };
        }

        // Nonce presence
        if (typeof payload.nonce !== 'string' || payload.nonce.length < 16) {
            return { ok: false, status: 'error', reason: 'bad_nonce' };
        }

        return { ok: true, status: 'verified', payload };
    } catch (e) {
        return { ok: false, status: 'error', reason: 'verification_failed' };
    }
}

// ==================== SERVER SANITY CHECK ====================

/**
 * Quick signature verification (no payload validation)
 */
export async function verifySignature(options: {
    payload_b64: string;
    signature_b64: string;
    publicKeyB64: string;
}): Promise<boolean> {
    try {
        const payloadBytes = fromBase64Url(options.payload_b64);
        const sigBytes = fromBase64Url(options.signature_b64);
        const pubBytes = fromBase64(options.publicKeyB64);
        return await ed25519.verifyAsync(sigBytes, payloadBytes, pubBytes);
    } catch {
        return false;
    }
}
