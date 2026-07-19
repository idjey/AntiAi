import { HttpException } from '@nestjs/common';

export const AttestationErrorCode = {
  SCHEMA_INVALID:      'ATT_SCHEMA_INVALID',       // 400
  HASH_MISMATCH:       'ATT_HASH_MISMATCH',        // 400 — canonical bytes ≠ payloadHash
  UNKNOWN_KEY:         'ATT_UNKNOWN_KEY',          // 403 — keyId not registered
  IDENTITY_SUSPENDED:  'ATT_IDENTITY_SUSPENDED',   // 403
  IDENTITY_REVOKED:    'ATT_IDENTITY_REVOKED',     // 403
  BAD_SIGNATURE:       'ATT_BAD_SIGNATURE',        // 401
  TIMESTAMP_SKEW:      'ATT_TIMESTAMP_SKEW',       // 422 — outside ±10 min
  RATE_LIMITED:        'ATT_RATE_LIMITED',         // 429 — includes retryAfterMs
  DOMAIN_FORBIDDEN:    'ATT_DOMAIN_FORBIDDEN',     // 403 — CIRCLE claim on public route, etc.
} as const;

export class AttestationError extends HttpException {
  constructor(
    public readonly code: keyof typeof AttestationErrorCode,
    status: number,
    public readonly detail?: Record<string, unknown>,
  ) {
    super({ code: AttestationErrorCode[code], detail }, status);
  }
}
