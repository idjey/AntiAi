# AntiAI.me — Community Attestation Architecture
## Master Implementation Blueprint (v1.0)

**Stack:** NestJS + TypeScript · PostgreSQL + Prisma · Next.js (App Router) + Tailwind · Ed25519 via tweetnacl
**Structure:** Turborepo monorepo — `apps/api` (NestJS), `apps/web` (Next.js), `apps/extension`, `apps/mobile`, `packages/attestation-core` (shared protocol library)

---

## 0. Cross-Cutting Foundation: `packages/attestation-core`

Build this package FIRST. Every surface (server, web, extension, mobile) must produce and verify byte-identical envelopes. If canonicalization differs anywhere, signatures break.

### 0.1 Canonical Serialization (the most important 50 lines in the codebase)

Ed25519 signs bytes, not objects. Two JSON serializations of the same object can differ (key order, whitespace, unicode escaping), so we define one canonical form based on RFC 8785 (JSON Canonicalization Scheme):

```typescript
// packages/attestation-core/src/canonicalize.ts
// Rules: keys sorted lexicographically (UTF-16 code units), no whitespace,
// numbers in shortest round-trip form, strings minimally escaped.
// Use the `canonicalize` npm package (RFC 8785 implementation) — do NOT hand-roll.
import canonicalize from 'canonicalize';

export function canonicalBytes(payload: AttestationPayload): Uint8Array {
  const json = canonicalize(payload);
  if (!json) throw new Error('Canonicalization failed');
  return new TextEncoder().encode(json);
}
```

### 0.2 Envelope Types

```typescript
// packages/attestation-core/src/types.ts
export const PROTOCOL_VERSION = '2.0';

export type ClaimType =
  // Public domain
  | 'provenance_found'      // payload: { sourceUrl, sourcePublishedAt?, matchMethod: 'phash'|'exact', matchScore }
  | 'artifact_flag'         // payload: { timestampMs?, region?, category: ArtifactCategory, note? }
  | 'context_note'          // payload: { note, references: string[] }
  | 'corroboration'         // payload: { targetAttestationId, verdict: 'confirm'|'dispute', evidence? }
  // Circle domain
  | 'custody_received'      // payload: { fromParty, method, caseRef? }
  | 'custody_transferred'   // payload: { toRoleCertId, method }
  | 'custody_sealed'        // payload: { sealMethod, storageRef }
  | 'integrity_verified'    // payload: { method: 'hash_recompute'|'visual_inspection', result }
  | 'redaction_applied'     // payload: { derivedSubjectHash, redactionSpec };

export interface AttestationPayload {
  version: string;
  subject: {
    hash: string;                 // sha256 hex of exact bytes — REQUIRED for all claims
    perceptualHash?: string;      // pHash/videohash hex — media claims only
    mediaType: 'video' | 'image' | 'audio' | 'pdf' | 'other';
    sizeBytes?: number;
  };
  claim: { type: ClaimType; payload: Record<string, unknown> };
  attester: { keyId: string; identityClass: 'pseudonymous' | 'verified_person' | 'organizational_role' };
  context: {
    domain: 'public' | `circle:${string}`;
    priorAttestation?: string;    // sha256 of prior envelope's canonical bytes (custody chains)
    timestamp: string;            // RFC3339 UTC
    nonce: string;                // 16 random bytes hex — replay protection
  };
}

export interface SignedAttestation {
  payload: AttestationPayload;
  payloadHash: string;            // sha256(canonicalBytes(payload)) — this is the chain-link ID
  signature: string;              // base64 Ed25519 signature over canonicalBytes(payload)
}
```

### 0.3 Sign / Verify

```typescript
// packages/attestation-core/src/crypto.ts
import nacl from 'tweetnacl';
import { canonicalBytes } from './canonicalize';

export function signAttestation(payload: AttestationPayload, secretKey: Uint8Array): SignedAttestation {
  const bytes = canonicalBytes(payload);
  const signature = nacl.sign.detached(bytes, secretKey);
  return {
    payload,
    payloadHash: bytesToHex(sha256(bytes)),
    signature: toBase64(signature),
  };
}

export function verifyAttestation(att: SignedAttestation, publicKey: Uint8Array): boolean {
  const bytes = canonicalBytes(att.payload);
  if (bytesToHex(sha256(bytes)) !== att.payloadHash) return false;
  return nacl.sign.detached.verify(bytes, fromBase64(att.signature), publicKey);
}
```

**Key management per surface:**
- **Extension:** keypair generated on install, secret key in `chrome.storage.local` (never synced), exportable as encrypted backup phrase.
- **Mobile:** secret key in Keychain (iOS) / Keystore (Android). Wrap tweetnacl key material; hardware-backed where available.
- **Web:** keypair in IndexedDB, non-extractable backup flow. Web keys start at lower base trust than app keys (no device attestation).
- **Circle roles (Phase 3):** org root in KMS/HSM; member role keys on managed devices.

---

## 1. The Prisma Schema

Complete `schema.prisma` for all three phases. Ship the whole schema at once (empty tables are free); gate features in code, not migrations. Phase annotations mark when each model goes live.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────── ENUMS ───────────────────────────

enum IdentityClass {
  PSEUDONYMOUS
  VERIFIED_PERSON
  ORGANIZATIONAL_ROLE
}

enum IdentityStatus {
  PROBATION        // cold-start: attestations recorded, near-zero weight
  ACTIVE
  SUSPENDED        // failed canaries / slashed below floor
  REVOKED
}

enum MediaType {
  VIDEO
  IMAGE
  AUDIO
  PDF
  OTHER
}

enum ClaimType {
  PROVENANCE_FOUND
  ARTIFACT_FLAG
  CONTEXT_NOTE
  CORROBORATION
  CUSTODY_RECEIVED
  CUSTODY_TRANSFERRED
  CUSTODY_SEALED
  INTEGRITY_VERIFIED
  REDACTION_APPLIED
}

enum AttestationDomain {
  PUBLIC
  CIRCLE
}

enum AttestationStatus {
  PENDING            // submitted, signature-valid, awaiting corroboration
  CORROBORATED       // independent confirmations above threshold
  DISPUTED           // active confirm/dispute conflict
  SETTLED_CORRECT    // ground truth arrived; claim was right
  SETTLED_INCORRECT  // ground truth arrived; claim was wrong
  MACHINE_VERIFIED   // e.g. provenance pHash match recomputed server-side
}

enum ReputationEventType {
  SETTLEMENT_CORRECT
  SETTLEMENT_INCORRECT
  CANARY_PASS
  CANARY_FAIL
  VOUCH_SLASH_PROPAGATION
  CORROBORATION_REWARD
  DECAY
  MANUAL_ADJUSTMENT
}

enum CircleDeployment {
  SAAS
  ON_PREM
}

// ─────────────────────── IDENTITY (Phase 1) ───────────────────────

model VerifierIdentity {
  id             String         @id @default(cuid())
  keyId          String         @unique              // first 16 bytes of sha256(publicKey), hex
  publicKey      String         @unique              // base64 Ed25519 public key (32 bytes)
  identityClass  IdentityClass  @default(PSEUDONYMOUS)
  status         IdentityStatus @default(PROBATION)
  displayHandle  String?        @unique
  platform       String                              // "extension" | "ios" | "android" | "web"
  deviceAttested Boolean        @default(false)      // App Attest / Play Integrity passed at registration

  // Reputation (Phase 2 — columns exist from day 1, engine activates later)
  reputation        Float    @default(0.10)          // R ∈ [0,1]
  accuracyScore     Float?                           // rolling canary+settlement accuracy
  attestationCount  Int      @default(0)
  settledCorrect    Int      @default(0)
  settledIncorrect  Int      @default(0)
  lastDecayAt       DateTime @default(now())

  attestations      Attestation[]
  reputationEvents  ReputationEvent[]
  canaryResponses   CanaryResponse[]
  vouchesGiven      Vouch[]            @relation("Voucher")
  vouchReceived     Vouch?             @relation("Vouchee")
  roleCertificates  RoleCertificate[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status, reputation])
}

model Vouch {
  id          String   @id @default(cuid())
  voucherId   String
  voucheeId   String   @unique                       // one voucher per identity
  voucher     VerifierIdentity @relation("Voucher", fields: [voucherId], references: [id])
  vouchee     VerifierIdentity @relation("Vouchee", fields: [voucheeId], references: [id])
  stakeAmount Float                                  // reputation staked at vouch time
  signature   String                                 // voucher signs "vouch:<voucheePubKey>:<timestamp>"
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([voucherId])
}

// ─────────────────────── SUBJECTS & ATTESTATIONS (Phase 1) ───────────────────────

model Subject {
  id               String    @id @default(cuid())
  hash             String    @unique                 // sha256 hex of exact bytes
  perceptualHash   String?                           // indexed for near-dup lookup
  mediaType        MediaType
  sizeBytes        BigInt?
  firstSeenAt      DateTime  @default(now())

  // Denormalized aggregate cache — recomputed by AggregationWorker
  attestationCount Int       @default(0)
  verdictSummary   Json?                             // { provenanceFound: {...}, flagCategories: {...}, confidence }
  checkCount       Int       @default(0)             // share-sheet lookups (intelligence-feed signal)

  attestations Attestation[]

  @@index([perceptualHash])
  @@index([checkCount, firstSeenAt])                 // "trending suspicious" queries
}

model Attestation {
  id            String            @id @default(cuid())
  payloadHash   String            @unique            // sha256 of canonical payload bytes — protocol-level ID
  version       String
  subjectId     String
  subject       Subject           @relation(fields: [subjectId], references: [id])
  claimType     ClaimType
  claimPayload  Json?                                // PUBLIC: plaintext structured claim
  encryptedPayload Bytes?                            // CIRCLE: ciphertext (server never holds keys)

  attesterId    String
  attester      VerifierIdentity  @relation(fields: [attesterId], references: [id])

  domain        AttestationDomain @default(PUBLIC)
  circleId      String?
  circle        Circle?           @relation(fields: [circleId], references: [id])
  roleCertId    String?                              // which role certificate authorized this (Circle only)
  roleCert      RoleCertificate?  @relation(fields: [roleCertId], references: [id])

  // Hash-linked chains (custody + corroboration threads)
  priorId       String?
  prior         Attestation?      @relation("AttestationChain", fields: [priorId], references: [id])
  successors    Attestation[]     @relation("AttestationChain")

  clientTimestamp DateTime                            // from signed payload
  receivedAt      DateTime         @default(now())    // server clock
  nonce           String
  signature       String                              // base64 Ed25519

  status        AttestationStatus @default(PENDING)
  settledAt     DateTime?
  weightAtAggregation Float?                          // effective weight after rep × correlation discount

  logEntry      TransparencyLogEntry?
  reputationEvents ReputationEvent[]

  @@unique([attesterId, subjectId, claimType, nonce]) // idempotency / spam guard
  @@index([subjectId, domain, status])
  @@index([attesterId, receivedAt])
  @@index([circleId, receivedAt])
}

// ─────────────────────── REPUTATION ENGINE (Phase 2) ───────────────────────

model ReputationEvent {
  id            String              @id @default(cuid())
  identityId    String
  identity      VerifierIdentity    @relation(fields: [identityId], references: [id])
  type          ReputationEventType
  delta         Float                                // signed change to R
  reputationAfter Float
  attestationId String?
  attestation   Attestation?        @relation(fields: [attestationId], references: [id])
  metadata      Json?                                // e.g. { propagatedFromVouchee: "..." }
  createdAt     DateTime            @default(now())

  @@index([identityId, createdAt])
}

model CanaryTask {
  id           String    @id @default(cuid())
  subjectHash  String    @unique                     // canary artifact's real hash
  mediaType    MediaType
  groundTruth  Json                                  // { authentic: bool, knownSource?: url, plantedArtifacts?: [...] }
  sourceConsent String                               // provenance of our right to use this clip
  active       Boolean   @default(true)
  servedCount  Int       @default(0)
  responses    CanaryResponse[]
  createdAt    DateTime  @default(now())
}

model CanaryResponse {
  id         String           @id @default(cuid())
  canaryId   String
  canary     CanaryTask       @relation(fields: [canaryId], references: [id])
  identityId String
  identity   VerifierIdentity @relation(fields: [identityId], references: [id])
  correct    Boolean
  claimEcho  Json                                    // what they actually claimed
  createdAt  DateTime         @default(now())

  @@unique([canaryId, identityId])
  @@index([identityId, createdAt])
}

model CorrelationCluster {
  id          String   @id @default(cuid())
  memberIds   String[]                               // VerifierIdentity ids
  signals     Json                                   // { vouchAncestor?, joinWindow?, timingCorr?, subjectOverlap? }
  discountFactor Float                               // applied at aggregation
  computedAt  DateTime @default(now())
  expiresAt   DateTime                               // clusters recomputed on a schedule

  @@index([expiresAt])
}

// ─────────────────────── CIRCLES & PKI (Phase 3) ───────────────────────

model Circle {
  id             String           @id @default(cuid())
  name           String
  slug           String           @unique
  rootPublicKey  String           @unique            // org root Ed25519 pubkey (base64); private key NEVER touches us
  deployment     CircleDeployment @default(SAAS)
  publicIdentity Json?                                // for Disclosure Bridge: { orgName, verifiedDomain, dnsProofRecord }

  roleCertificates RoleCertificate[]
  attestations     Attestation[]
  revocations      Revocation[]

  createdAt DateTime @default(now())
}

model RoleCertificate {
  id              String    @id @default(cuid())
  serial          String    @unique                  // included in signed cert body
  circleId        String
  circle          Circle    @relation(fields: [circleId], references: [id])
  identityId      String
  identity        VerifierIdentity @relation(fields: [identityId], references: [id])
  roleName        String                             // "Evidence Custodian", "Paralegal — Discovery 3"
  allowedClaims   ClaimType[]                        // Postgres enum array
  validFrom       DateTime
  validUntil      DateTime
  certBody        Json                               // canonical cert payload that was signed
  rootSignature   String                             // Ed25519 sig by circle root over canonical certBody

  revokedAt       DateTime?
  revocationId    String?
  revocation      Revocation? @relation(fields: [revocationId], references: [id])

  attestations    Attestation[]

  @@index([circleId, identityId])
  @@index([validFrom, validUntil])
}

model Revocation {
  id            String   @id @default(cuid())
  circleId      String
  circle        Circle   @relation(fields: [circleId], references: [id])
  certSerials   String[]
  reason        String?
  effectiveAt   DateTime                             // certs invalid for attestations AFTER this time only
  rootSignature String                               // signed revocation statement
  createdAt     DateTime @default(now())
  certificates  RoleCertificate[]
}

// ─────────────────────── TRANSPARENCY LOG (Phase 3) ───────────────────────

model TransparencyLogEntry {
  id            String   @id @default(cuid())
  seqIndex      BigInt   @unique                     // strictly monotonic leaf index
  leafHash      String   @unique                     // sha256(0x00 || payloadHash) per RFC 6962 leaf hashing
  attestationId String?  @unique                     // null ⇒ opaque circle commitment
  attestation   Attestation? @relation(fields: [attestationId], references: [id])
  isOpaque      Boolean  @default(false)
  createdAt     DateTime @default(now())
}

model MerkleCheckpoint {
  id         String   @id @default(cuid())
  treeSize   BigInt   @unique
  rootHash   String
  signature  String                                  // server's log key signs "treeSize||rootHash||timestamp"
  rfc3161Token Bytes?                                // external TSA countersignature on the root
  witnessCosigs Json?                                // future: independent witness signatures
  createdAt  DateTime @default(now())
}
```

**Schema decisions worth flagging to your co-developer:**

1. `payloadHash` is the protocol-level ID; `id` (cuid) is only a DB convenience. Chains link via `payloadHash` in the signed payload, mirrored to `priorId` FK for queryability. On insert, resolve `context.priorAttestation` → row and reject if missing (no dangling chain links in Circle domain).
2. `claimPayload` XOR `encryptedPayload` — enforce in a service-layer guard (Prisma can't express XOR constraints): PUBLIC rows must have plaintext, CIRCLE rows must have ciphertext only.
3. The unique `[attesterId, subjectId, claimType, nonce]` gives cheap idempotency; retries with the same signed envelope are no-ops.
4. `weightAtAggregation` is snapshotted so historical verdicts are auditable even after reputations change.

---

## 2. Phase 1 — Core Protocol & Public Quests (Weeks 1–5)

**Goal:** a user taps Share → AntiAI, sees the crypto verdict + community evidence, and can submit a signed provenance claim. No reputation math yet — everything is recorded, equally weighted, marked clearly as "early signal."

### 2.1 NestJS Modules

```
apps/api/src/
├── identity/        IdentityModule
├── subjects/        SubjectsModule
├── attestations/    AttestationsModule
├── provenance/      ProvenanceModule (quest verification worker)
└── common/          SignatureGuard, CanonicalizationService (wraps attestation-core)
```

### 2.2 API Endpoints

**IdentityModule**

| Method | Route | Behavior |
|---|---|---|
| POST | `/v1/identities/challenge` | Body: `{ publicKey }`. Returns random 32-byte challenge, stored in Redis with 5-min TTL. |
| POST | `/v1/identities/register` | Body: `{ publicKey, challengeSignature, platform, deviceAttestationToken? }`. Verifies proof-of-possession (signature over challenge), validates App Attest / Play Integrity token when present, creates `VerifierIdentity` in `PROBATION`. Returns `keyId`. |
| GET | `/v1/identities/:keyId` | Public profile: identityClass, status, attestationCount. Never expose reputation internals precisely (see §3.5). |

**SubjectsModule**

| Method | Route | Behavior |
|---|---|---|
| POST | `/v1/subjects/resolve` | Body: `{ hash?, perceptualHash?, mediaType }`. Exact-hash lookup first; else pHash nearest-neighbor (Hamming distance ≤ threshold via a `pg_trgm`-style bit index or in-memory BK-tree service). Creates Subject if new; increments `checkCount`. Returns subject + verdict summary. **This is the share-sheet hot path — target p95 < 150ms.** |
| GET | `/v1/subjects/:hash` | Full detail: crypto-verdict status (join against your existing creator-signature tables), attestation aggregate, timeline. |
| GET | `/v1/subjects/:hash/attestations` | Paginated raw attestations (public domain only), each independently verifiable client-side. |

**AttestationsModule**

| Method | Route | Behavior |
|---|---|---|
| POST | `/v1/attestations` | Body: full `SignedAttestation`. Pipeline below. |
| GET | `/v1/attestations/:payloadHash` | Fetch one envelope + status. |
| POST | `/v1/attestations/:payloadHash/corroborate` | Sugar for submitting a `corroboration` claim targeting an existing attestation. |

**Submission pipeline (`AttestationsService.submit`)** — order matters:

1. **Schema-validate** envelope (zod schema from attestation-core; reject unknown claim types for the declared domain).
2. **Recompute canonical bytes → verify `payloadHash`** matches. Reject on mismatch (client canonicalization bug or tampering).
3. **Verify Ed25519 signature** against registered `publicKey` for `attester.keyId`. Unregistered key ⇒ 403 with registration hint.
4. **Timestamp sanity:** `|clientTimestamp − now| ≤ 10 min`, else reject (prevents backdated public claims; Circle chains get real timestamping in Phase 3).
5. **Rate limits:** sliding window per identity (Redis): e.g. 30 attestations/hour, 5/minute — "rate physics." Probation identities get half.
6. **Idempotency check** on the unique constraint; return existing row on duplicate.
7. **Persist** attestation + increment Subject counters in one transaction.
8. **Enqueue** `aggregation` job (BullMQ) and, if `claimType = PROVENANCE_FOUND`, a `provenance-verify` job.

**ProvenanceModule (the machine-checkable quest)**

`provenance-verify` worker: fetch the claimed `sourceUrl` (allowlisted domains initially: YouTube, TikTok, X, Instagram, news CDNs — SSRF guard: block private IP ranges, resolve-then-connect pinning), download media, compute pHash, compare against subject's pHash. Hamming distance ≤ 8 ⇒ mark attestation `MACHINE_VERIFIED` and store `matchScore`. This is deterministic hashing, not AI — on-philosophy.

### 2.3 Aggregation (Phase 1 version — deliberately dumb)

`AggregationWorker` recomputes `Subject.verdictSummary`:

```typescript
{
  provenance: { bestMatch: { url, publishedAt, matchScore, status } | null },
  flags: { lip_desync: 3, audio_splice: 1, ... },        // counts by category
  contextNotes: [{ note, corroborations: 4, disputes: 0 }],
  signal: 'EARLY',   // Phase 1 constant — UI copy: "unweighted early community signal"
}
```

No fake/real percentage anywhere. Evidence objects only.

### 2.4 Frontend (Next.js App Router)

```
apps/web/src/
├── app/v/[hash]/page.tsx            // public verdict page (shareable permalink)
├── app/verify/page.tsx              // paste-a-URL / upload-hash entry point
└── components/verification/
    ├── VerdictBanner.tsx            // ✅ ⚠️ ❓ 🚨 — crypto verdict always on top
    ├── EvidencePanel.tsx            // renders verdictSummary as evidence cards
    ├── AttestationTimeline.tsx      // chronological signed events, per-item "verify signature" affordance
    ├── ProvenanceHuntForm.tsx       // URL input → optimistic pending card → MACHINE_VERIFIED update via polling/SSE
    ├── FrameFlagScrubber.tsx        // <video> scrubber, pin timestamp, category picker
    ├── ContextNoteComposer.tsx
    └── KeyOnboarding.tsx            // generate keypair, backup flow, register — must be < 60s
```

Client-side signature verification in `AttestationTimeline` (tweetnacl runs fine in-browser) is a trust feature: "don't trust our server — check the math" with a literal button. The share-sheet mobile UI mirrors `VerdictBanner` + `EvidencePanel` in a bottom sheet; contribution flows deep-link into the app.

### 2.5 Phase 1 Exit Criteria

- Round-trip: extension-signed envelope → API verify → visible on `/v/[hash]` → signature re-verified in a *different* client (proves cross-surface canonicalization).
- Provenance quest end-to-end with a real YouTube re-upload.
- Load: `/v1/subjects/resolve` p95 < 150ms at 100 rps.

---

## 3. Phase 2 — Reputation & Sybil Resistance (Weeks 6–12)

**Golden rule: collect from day 1, enforce gradually.** Every Phase 2 mechanism ships behind a feature flag in *shadow mode* first — computing scores and logging what it *would* have done — for 2+ weeks before it affects visible aggregation. This gives you calibration data and prevents a botched slashing curve from nuking honest early adopters.

### 3.1 Module Layout

```
apps/api/src/reputation/
├── reputation.module.ts
├── engine/
│   ├── settlement.service.ts        // ground-truth resolution → rep events
│   ├── slashing.service.ts          // curves + vouch propagation
│   ├── canary.service.ts            // seeding + scoring
│   └── correlation.service.ts       // cluster detection
└── workers/
    ├── aggregation-v2.worker.ts     // weighted verdicts
    ├── cluster-recompute.worker.ts  // nightly
    └── decay.worker.ts              // weekly
```

### 3.2 Reputation Math (initial constants — all in a `ReputationConfig` table, hot-tunable)

Reputation `R ∈ [0, 1]`, start `R₀ = 0.10` (probation).

**Attestation weight:** `w = R^1.5 × platformFactor` where platformFactor = 1.0 (device-attested app), 0.6 (web key). Superlinear exponent makes ten R=0.1 sock puppets (Σw ≈ 0.32) worth far less than one R=0.7 veteran (w ≈ 0.59).

**Earning:** settlement-correct: `ΔR = +0.02 × (1 − R)` (logistic — diminishing returns near the top). Canary pass: `+0.005 × (1 − R)`. Machine-verified provenance find: `+0.03 × (1 − R)` (the highest reward — it's the most valuable and least fakeable contribution).

**Slashing (asymmetric by design — wrongness costs ~4× rightness):**
`ΔR = −0.08 × R × confidenceAtSettlement`, where `confidenceAtSettlement ∈ [0,1]` is how strongly the verifier's claim was asserted/corroborated when ground truth landed. Being loudly wrong hurts more than being tentatively wrong. Floor: if R drops below 0.03, status → `SUSPENDED` (attestations recorded, weight zero, appeal path exists).

**Vouch propagation:** when a vouchee is slashed within 90 days of vouching, voucher takes `β = 0.25 × |ΔR_vouchee|`, one level up only (no infinite cascades). Vouching requires `R ≥ 0.4`; max 5 active vouches per voucher. This prices sock-puppet onboarding in scarce, slow-to-rebuild reputation.

**Decay:** `R → max(R₀, R × 0.995)` weekly when inactive >30 days. Prevents parked high-rep accounts becoming a resale market.

Every change is an append-only `ReputationEvent` — the reputation ledger is itself auditable, which you'll need the day a power user disputes a slash publicly.

### 3.3 Calibration Canaries

- `CanaryService.seed()`: maintain a pool of ≥200 active canaries (consented creator-signed clips as "authentic" ground truth; commissioned synthetic clips as "fake"). Track `sourceConsent` — you cannot run this on scraped content.
- **Injection:** when a verifier opens contribution flows, ~5% of served tasks are canaries, delivered through the identical UI/API path (the task feed endpoint decides; the client cannot distinguish).
- **Scoring:** rolling 20-canary window → `accuracyScore`. Below 0.55 over a full window ⇒ silent down-weight (`platformFactor × 0.3`); below 0.35 ⇒ `SUSPENDED`.
- **Silence is the weapon:** never surface canary results per-item. An attacker who can't measure their influence can't tune their attack. (Aggregate accuracy percentile in the Verifier Passport is fine — it's noisy enough.)
- **Rotation:** retire canaries after ~500 serves or on any suspicion of external sharing; `servedCount` exists for exactly this.

### 3.4 Correlation Discounting (`cluster-recompute.worker`, nightly)

Compute pairwise correlation signals across active identities:

1. **Vouch ancestry:** shared ancestor within 2 hops.
2. **Temporal joins:** registration within the same 72h window from similar platform fingerprints.
3. **Co-attestation timing:** repeated attestations on the same subjects within 10-minute windows (Jaccard on (subject, time-bucket) sets).
4. **Subject overlap:** near-identical verification portfolios (cosine similarity on subject vectors).

Union-find over pairs exceeding thresholds ⇒ `CorrelationCluster` rows. At aggregation, a cluster's combined weight is compressed:

```
W_cluster = (Σ wᵢ)^(1/√n)   // n = cluster size
```

Fifty coordinated accounts ≈ the weight of ~1.7 independent ones. Store per-cluster `discountFactor`; snapshot into `Attestation.weightAtAggregation`.

Also implement the **evidence-beats-volume invariant** directly in `aggregation-v2`: `context_note` and `artifact_flag` claims can never flip a verdict that a `MACHINE_VERIFIED` provenance match supports, regardless of aggregate weight. This is your organic-brigading defense, hard-coded, documented publicly.

### 3.5 Settlement Engine

`SettlementService` listens for ground-truth events: the claimed creator signs or disclaims the subject (your existing creator flow), a machine-verified provenance match settles date/origin questions, or manual T&S adjudication (admin endpoint, dual-control: two staff signatures required). On settlement: walk all `PENDING/CORROBORATED/DISPUTED` attestations for the subject, classify correct/incorrect per claim type, emit reputation events in one transaction, set `SETTLED_*` statuses.

**API surface added in Phase 2:** `GET /v1/identities/:keyId/passport` (badges, accuracy *percentile band*, streak — never raw R, which would give attackers a measurement oracle), `GET /v1/tasks/feed` (quest feed w/ canary injection), `POST /v1/vouches`, `GET /v1/leaderboard`.

### 3.6 Phase 2 Exit Criteria

- Shadow-mode logs show weighted verdicts diverging from naive counts on manufactured brigade tests (red-team it yourselves: script 50 web keys, mass-flag a test subject, confirm compressed weight ≈ noise).
- Canary pipeline live with ≥200 tasks and rotation working.
- Slashing + vouch propagation verified on staging with property-based tests (fast-check): invariants like `R` bounded [0,1], no cascade beyond one hop, suspension floor honored.

---

## 4. Phase 3 — Enterprise Suite: Circles & Transparency Log (Weeks 13–24)

Two independent tracks; the log can (and should) start earlier since public attestations feed it too.

### 4.1 Circle PKI

```
apps/api/src/circles/
├── circles.module.ts
├── circle-admin.controller.ts     // org onboarding, root key registration
├── role-certs.controller.ts
├── cert-chain.service.ts          // THE validator — most security-critical service in the codebase
└── revocation.service.ts
```

**Org onboarding:** org generates root keypair *offline* (provide a CLI: `antiai-org init` — generates key, prints sealed backup instructions, never transmits the secret). `POST /v1/circles` registers only the public key + DNS-TXT domain proof for the Disclosure Bridge identity.

**Role certificate lifecycle:**

```typescript
// Cert body (canonicalized, signed by org root — OFFLINE or via org's KMS)
{
  serial: uuid,
  circleId, subjectKeyId,            // the member's Ed25519 key
  roleName: "Evidence Custodian",
  allowedClaims: ["CUSTODY_RECEIVED","CUSTODY_TRANSFERRED","CUSTODY_SEALED","INTEGRITY_VERIFIED"],
  validFrom, validUntil,             // max 1 year
}
```

`POST /v1/circles/:id/certs` uploads body + rootSignature; server verifies against `rootPublicKey` and stores. The server *witnesses* certificates, it never *issues* them — the org root never touches your infrastructure. Same pattern for revocations: signed statements with `effectiveAt`, uploaded.

**`CertChainService.validate(attestation)` — temporal validation, the crux:**

1. Attester's `keyId` matches cert's `subjectKeyId`.
2. Cert's `rootSignature` verifies against the Circle root.
3. `claimType ∈ allowedClaims`.
4. `validFrom ≤ clientTimestamp ≤ validUntil`.
5. No revocation with `effectiveAt ≤ clientTimestamp`. **Revocation is prospective:** a custodian fired in June does not invalidate March custody links. Test this exhaustively — it's the semantic courts care about.
6. Chain integrity: `context.priorAttestation` resolves to an existing attestation on the *same subject* in the *same circle*, and no competing successor exists (custody chains are linear; a fork ⇒ reject + alert circle admins).

**Circle attestation submission** reuses `POST /v1/attestations` with `domain: circle:<id>`: payload arrives as `encryptedPayload` ciphertext (client-side encryption to circle members — use libsodium sealed boxes per-member or an X25519 group key derived from members' encryption keys; keep key distribution client-side), plus a small plaintext header (subjectHash, claimType, priorAttestation) needed for chain validation. Server validates chain + cert, stores ciphertext, logs an opaque commitment.

**Audit Viewer** (`apps/web/app/circles/[slug]/chains/[subjectHash]`): decrypts client-side (keys never leave the org), renders a printable timeline — each link showing role, timestamp, claim, signature-check ✅, log-inclusion ✅. Deliberately boring; a judge reads this. Ship alongside it `packages/verifier-cli` — an **open-source standalone verifier** (`npx @antiai/verify chain.json`) so opposing counsel can validate without an AntiAI account. Without this, your admissibility story is "trust the vendor," which is no story.

### 4.2 Transparency Log (RFC 6962-style)

```
apps/api/src/tlog/
├── tlog.module.ts
├── append.service.ts        // single-writer sequencer
├── merkle.service.ts        // tree math, inclusion + consistency proofs
├── checkpoint.worker.ts     // hourly signed tree heads + RFC3161 anchor
└── tlog.controller.ts
```

- **Append:** every accepted attestation (public: full `payloadHash`; circle: opaque commitment `sha256(payloadHash || blinding_nonce)` where the org keeps the nonce — prevents even correlation of circle activity) becomes a leaf. **Sequencing must be a single serialized writer** — a Postgres advisory-lock'd transaction incrementing `seqIndex`. Never parallel-write a Merkle log.
- **Leaf hashing:** RFC 6962 domain separation — leaf = `sha256(0x00 || data)`, interior = `sha256(0x01 || left || right)`. Prevents second-preimage tree attacks. Don't improvise here.
- **Checkpoints:** hourly worker computes root over current `treeSize`, signs with a dedicated log key (KMS-held, *not* the API's key), obtains RFC 3161 timestamp on the root from an external TSA (e.g., DigiCert/FreeTSA), stores `MerkleCheckpoint`, publishes at `GET /v1/tlog/checkpoint` (also mirror checkpoints to a public GitHub repo — free, independent, timestamped witness).
- **Proof APIs:** `GET /v1/tlog/proof/inclusion?leafHash=&treeSize=` and `GET /v1/tlog/proof/consistency?first=&second=`. Consistency proofs are what let any third party confirm the log is append-only (no rewrites) between any two checkpoints. Verifier-cli consumes both.
- **Backfill:** on activation, append all historical Phase 1–2 attestations in `receivedAt` order as a genesis batch, then publicly document the genesis checkpoint. The log's value compounds with age — start it the moment Phase 1 is stable, don't wait for Phase 3 proper.

### 4.3 Disclosure Bridge

`POST /v1/circles/:id/disclose`: org submits a *new public-domain attestation*, signed by a designated org disclosure key (a role cert with a `context_note`/`provenance_found`-class permission), whose payload references the opaque log commitments of the underlying circle chain: "N custody links exist for subject H, sealed at T — inclusion proofs attached, contents confidential." Public UI renders: *"✅ Reuters attests chain of custody (3 links, sealed 2026-07-12) — cryptographically proven to exist since [date], contents private."* No new primitive — it's just an attestation about attestations, which is the payoff of the unified envelope.

### 4.4 Phase 3 Exit Criteria

- Full custody lifecycle on staging: org init → 3 role certs → intake → transfer → seal → revoke one cert → verify March links still validate → export chain → verify with standalone CLI offline.
- Log holds 1M+ leaves with inclusion-proof p95 < 100ms (proofs are O(log n) DB reads; precompute subtree hashes in a `MerkleNode` cache table if needed).
- External audit of `CertChainService` + `MerkleService` before any legal-market sale. Non-negotiable — these two services are the product.

---

## 5. Sequencing Summary & Risk Register

| Weeks | Deliverable | Flag |
|---|---|---|
| 1–2 | `attestation-core` + cross-surface canonicalization tests | — |
| 2–5 | Phase 1 API + share-sheet/web UI + provenance worker | `public_attestations` |
| 5–6 | Transparency log append + checkpoints (early start) | `tlog` |
| 6–9 | Reputation engine in shadow mode; canary pool build-out | `reputation_shadow` |
| 9–12 | Weighted aggregation live; vouches; passport UI | `reputation_live` |
| 13–18 | Circle PKI + cert chain validator + encrypted payloads | `circles` |
| 18–22 | Audit viewer + verifier-cli (open source) + proofs API | — |
| 22–24 | Disclosure Bridge + external security audit | `disclosure` |

**Top risks, pre-answered:**
1. **Canonicalization drift** between surfaces → shared package + golden-vector test suite (fixed payloads → expected bytes/signatures) run in every app's CI.
2. **Slashing curve tuned wrong** → shadow mode + hot-tunable `ReputationConfig` + append-only event ledger enabling replay/recompute.
3. **Merkle log corruption** → single-writer sequencer, RFC 6962 domain separation, external RFC 3161 anchoring, mirrored checkpoints. Treat the log as write-once from day 1.
4. **Circle key loss** (org loses root) → document threshold/backup ceremony in onboarding CLI; offer optional 2-of-3 root splitting before any courthouse deal.
5. **SSRF via provenance URLs** → domain allowlist + IP-range blocking + fetch in an isolated worker with no VPC credentials.

Everything above composes into one sentence for the repo README: *creators sign content, verifiers sign verdicts, orgs sign roles, the log signs time.*
