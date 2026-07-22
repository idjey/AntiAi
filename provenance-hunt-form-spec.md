# ProvenanceHuntForm — Implementation Spec
## File-Drop Bootstrapping · Server-Side pHash · The First Organic Attestation

Scope: the smallest complete path from "user has a file" to "signed `provenance_found` claim accepted by the API." This is the quest that turns registered identities into the organic traffic the shadow clock needs, and the only client path that can reach `MACHINE_VERIFIED`.

Prerequisite: `feature/phase-1-client-layer` merged with **full CI green including `foundation.e2e-spec.ts`** — the isomorphic crypto rewrite changed the verification path on both sides of the protocol and that test is the proof it still holds.

---

## 0. The Flow, End to End

```
[ app/v/page.tsx — file drop ]
        │  user drops file
        ▼
  chunked SHA-256 (fast-sha256, streamed)          ← client, same impl as golden vectors
        │
        ├─ image? ──► POST /v1/subjects/phash (bytes) ──► perceptualHash
        │
        ▼
  POST /v1/subjects/resolve { hash, perceptualHash?, mediaType }
        │
        ▼
  router.push(`/v/${hash}`)                        ← canonical, shareable
        │
[ app/v/[hash]/page.tsx — minimal host ]
        │  GET /v1/subjects/:hash
        ▼
  ┌─ SubjectSummary (what's known) ─────────┐
  │  hash, mediaType, attestation count      │
  │  existing provenance claims, if any      │
  ├─ ProvenanceHuntForm ────────────────────┤
  │  "Found an earlier source?" [URL] [Submit]│
  └──────────────────────────────────────────┘
        │  sign + submit
        ▼
  POST /v1/attestations  →  201  →  poll for MACHINE_VERIFIED
```

Onboarding (from the merged Phase 1 work) triggers lazily: if no identity exists in IndexedDB when the user hits Submit, run `generateIdentity()` + `registerIdentity()` inline, then submit. The quest is the reason to onboard — never a separate gate in front of it.

---

## 1. New API Endpoint: `POST /v1/subjects/phash`

The one piece of new backend. Accepts uploaded bytes, returns a perceptual hash. **No fetch, no URL — the client already has the bytes, so there is no SSRF surface.**

```
POST /v1/subjects/phash
Content-Type: multipart/form-data
Body: file (binary)

200 → { perceptualHash: string }        // 16 hex chars, 64-bit
415 → unsupported media type            // non-image in v1
413 → payload too large
```

Implementation notes:

- **Images only in v1.** Reuse the `sharp` + `blockhash-core` pipeline already in `apps/provenance-worker`. Extract it into a shared module (`packages/phash` or an exported service) so the worker and this endpoint compute identical hashes — a divergence here means client-computed subjects never match worker-computed provenance results, silently breaking every image provenance quest.
- **Hard size cap: 25 MB** for images, enforced before buffering. Reject early with 413.
- **MIME sniff the actual bytes**, don't trust `Content-Type` — `file-type` or `sharp`'s own metadata read. A client claiming `image/png` while uploading something else must be rejected, not fed to `sharp`.
- **Bytes are processed and discarded.** Never written to disk, never persisted. This endpoint computes and forgets — say so in the code comment, because "we don't store your files" is a product claim as much as an implementation detail.
- **Rate limit it** — reuse the existing `RateLimitService` pattern, keyed on IP for unauthenticated use (this endpoint is hit *before* identity registration in the flow). Something like 20/minute; it's CPU work and trivially abusable otherwise.
- **Run it in the API process for now**, but keep the extraction clean — if `sharp` CPU load becomes an issue, it moves to a worker without touching the client contract.

Video/audio/PDF: return `415` and let the client proceed with exact-hash only. `MACHINE_VERIFIABLE` already excludes video server-side, so nothing regresses; the subject is created with `perceptualHash: null` and provenance claims on it stay `PENDING` for human corroboration.

---

## 2. Client-Side Chunked Hashing

```typescript
// packages/attestation-core/src/hash-file.ts
import { Hash } from 'fast-sha256';           // SAME impl the golden vectors cover

const CHUNK = 4 * 1024 * 1024;                // 4 MB

export async function hashFile(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const h = new Hash();
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK);
    const buf = new Uint8Array(await slice.arrayBuffer());
    h.update(buf);
    offset += CHUNK;
    onProgress?.(offset / file.size);
  }
  return toHex(h.digest());
}
```

**Do not use `crypto.subtle.digest`.** Two reasons: it requires the whole file in memory (falls over on large video), and it's a *different* SHA-256 implementation than the one golden vectors validate. The whole point of the isomorphic rewrite was one hash path across client and server; introducing a second would put the subject hash outside that guarantee.

Progress callback matters — hashing a 200 MB file takes seconds and a frozen UI reads as a broken app.

---

## 3. Frontend

```
apps/web/src/app/v/
├── page.tsx                        // drop zone → hash → resolve → redirect
└── [hash]/page.tsx                 // minimal host: summary + quest

apps/web/src/components/verification/
├── FileDropZone.tsx                // drag/drop + picker, progress bar
├── SubjectSummary.tsx              // what's known about this subject
└── ProvenanceHuntForm.tsx          // the quest itself
```

### 3.1 `app/v/page.tsx` — the entry point

Drop zone. On file selected: hash with progress → if image, POST to `/phash` → POST `/resolve` → `router.push('/v/' + hash)`. Errors surface plainly ("couldn't read that file," "file too large for perceptual matching, continuing with exact match").

### 3.2 `app/v/[hash]/page.tsx` — minimal host

Deliberately minimal. This is **not** the full verdict page from the client spec (no `VerdictBanner`, no `AttestationTimeline`, no crypto-verdict integration) — that's a later build. This page exists to host the quest and show enough context that submitting makes sense:

- Subject identity: truncated hash, media type, when first seen.
- What's known: attestation count, existing provenance claims (URL + status badge: `PENDING` / `MACHINE_VERIFIED`).
- **Honest framing copy**: "Community verification — early signal, unweighted." Do not render any confidence percentage or fake/real verdict. That rule holds from day one even on a minimal page; it's easier to never add it than to remove it later.
- Cold-load safe: works from a bare URL with only the hash, no assumed client state (this page is the eventual share-sheet target).

### 3.3 `ProvenanceHuntForm.tsx`

```
┌──────────────────────────────────────────────┐
│ Found an earlier version of this?             │
│ [ https://…                              ]    │
│ Paste a link to where this appeared first.    │
│                              [ Submit claim ] │
└──────────────────────────────────────────────┘
```

Client-side validation: well-formed `https://` URL only. This is **UX validation, not security** — the real SSRF defense is server-side in the isolated worker's `assertSafeAndPin`. Don't duplicate the allowlist client-side; it'll drift.

On submit:

```typescript
// 1. Lazy onboarding
let identity = await loadIdentity();                    // IndexedDB
if (!identity) identity = await onboardIdentity('WEB'); // generate + register inline

// 2. Build claim
const payload = {
  version: '1.0',
  subject: { hash, perceptualHash, mediaType },
  claim: { type: 'provenance_found', payload: { sourceUrl } },
  attester: { keyId: identity.keyId, identityClass: 'pseudonymous' },
  context: {
    domain: 'public',
    timestamp: new Date().toISOString(),
    nonce: randomHex(16),                               // FRESH per envelope — see below
  },
};

// 3. Sign + submit
const signed = signAttestation(payload, identity.secretKey);
const res = await api.post('/v1/attestations', {
  payload: signed.payload, payloadHash: signed.payloadHash, signature: signed.signature,
});
```

**Fresh random nonce per envelope, always.** The idempotency constraint is `[attesterId, subjectId, claimType, nonce]`; a reused nonce collapses distinct claims into a false duplicate. The brigade sim's `'mock-nonce'` is exactly the bug to avoid shipping.

### 3.4 Error handling — map the taxonomy to human copy

| Code | Status | User sees | Action |
|---|---|---|---|
| `ATT_TIMESTAMP_SKEW` | 422 | "Your device clock is off — retrying" | auto re-sign with `serverTime` from the body, resubmit once |
| `ATT_RATE_LIMITED` | 429 | "Slow down — try again in Ns" | countdown from `retryAfterMs` |
| `ATT_UNKNOWN_KEY` | 403 | "Re-establishing your verifier identity" | key was cleared → re-run onboarding, resubmit |
| `ATT_BAD_SIGNATURE` / `ATT_HASH_MISMATCH` | 401 / 400 | "Something went wrong signing — please report" | **do not retry**; this means client/server crypto divergence, which is a bug, not a transient |
| 201 `duplicate: true` | — | "You've already submitted this claim" | show the existing claim |

The auto-retry on clock skew is worth building — mobile and laptop clocks drift constantly and the server hands you the correct time in the 422 body specifically so the client can self-correct.

### 3.5 Post-submit: the payoff moment

Show the claim as `PENDING` immediately, then poll `GET /v1/subjects/:hash` every 5s (stop after ~2 min). When the provenance worker resolves it, flip to `MACHINE_VERIFIED` with the match score. **This is the single most satisfying moment in the product** — the user's contribution getting machine-confirmed — so make it visible: a state change, not a silent refresh. If it stays `PENDING` (video, or no pHash match), say so honestly: "Awaiting community corroboration."

---

## 4. Verification

**CI (all merge-blocking):**

- **`phash` endpoint unit tests**: same image at different compressions → hashes within Hamming distance 8; different images → distance > 8; non-image upload → 415; oversized → 413; MIME spoofing (PNG header, non-image body) → rejected.
- **Shared-pipeline parity**: the extracted pHash module produces byte-identical output when called from the endpoint and from the provenance worker. This is the test that prevents silently-broken image provenance.
- **`hashFile` browser test** (Playwright, existing harness): hash a fixture file in the browser, assert it matches the Node-computed SHA-256 of the same bytes. Extends the golden-vector gate to file hashing.
- **Full quest e2e** (Playwright): drop fixture image → hash → resolve → submit claim → assert 201 and that a row exists via the API. **This is the client analog of `foundation.e2e-spec.ts` for the write path** — the first browser-originated attestation proven end-to-end.

**Manual (local only, never against the Railway instance):**
Drop an image, watch progress, confirm subject row created with `perceptualHash` populated, submit a real earlier-source URL, watch it flip to `MACHINE_VERIFIED`. That flip is the whole system working: browser crypto → API guards → isolated worker → pHash match → aggregation.

---

## 5. Build Order

1. Extract the shared pHash module (worker + endpoint use it) — do this first, it's the thing two callers depend on.
2. `POST /v1/subjects/phash` with its tests.
3. `hashFile` in `attestation-core` + Playwright hash test.
4. `app/v/page.tsx` drop zone + resolve flow.
5. `app/v/[hash]/page.tsx` minimal host.
6. `ProvenanceHuntForm` + lazy onboarding + error taxonomy.
7. Full quest e2e in Playwright.

Steps 1–3 are backend/shared and independently testable; 4–6 are the UI. Don't start 4 until 1–3 are green, or you'll debug UI against an unproven hash path.

---

## 6. Explicitly Out of Scope

Named so they don't creep in: the full verdict page (`VerdictBanner`, `AttestationTimeline`, crypto-verdict integration), `FrameFlagScrubber`, `ContextNoteComposer`, video pHash (needs FFmpeg — deferred server-side too), the browser extension, and migrating the legacy `app/verify/[id]` YouTube page. This spec ships **one quest, end to end, proven** — that's what starts real traffic. Everything else is next.
