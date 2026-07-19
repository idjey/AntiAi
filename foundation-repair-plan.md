# Foundation Repair Plan
## AntiAI.me · Post-Audit Recovery Cycle (est. 5–8 working days)

Premise: the audit proved **file existence**, not behavior. Every component below marked "exists" is unverified code until a test in CI exercises it. This plan's job is to convert the codebase from *claimed* to *proven*, in dependency order, and to make the claim/proof gap structurally impossible going forward.

Order is forced. Do not parallelize steps 0→2; each one's verification depends on the previous.

---

## Step 0 — Repair the test runner (½–1 day) · BLOCKS EVERYTHING

**Root cause:** Babel is parsing `.spec.ts` without TypeScript support, throwing `SyntaxError` on type annotations. Two candidate fixes:

- **Preferred:** `ts-jest` preset at the monorepo root, shared by all apps. Type-checks during tests, which catches a whole class of drift the transpile-only path misses.
- **Faster:** add `@babel/preset-typescript` to the Babel config. Transpile-only, no type checking. Acceptable only if `ts-jest` fights the Turborepo setup.

Fix once at the root, not per-app — the per-app divergence is what let two apps silently lose their test runner while others appeared fine.

**Exit criteria:**
```bash
pnpm turbo run test        # every app + package, zero SyntaxErrors
```
Every spec file in the repo either passes or fails *on assertions*. A spec that fails to parse is indistinguishable from a spec that doesn't exist.

**Then immediately run the two dead tests and expect failures.** They have never executed; their assertions have never been checked against reality. Budget time for real bugs surfacing in:
- `ssrf-guard.spec.ts` — if any attack-matrix case fails, that is a live security hole, not a test bug. Triage each failure as: guard is wrong (fix guard) vs. test is wrong (fix test, justify in the PR description). **Never "fix" a failing SSRF case by weakening the assertion.**
- `subject-phash.repository.spec.ts` — testcontainers + real Postgres 15. If the distance-boundary cases fail, the `BIT(64)` architecture decision needs re-examination before anything is built on it.

---

## Step 1 — Identities module (1–2 days)

The gap that makes everything upstream inert. Build to the Phase 1 spec, no deviations:

```
apps/api/src/modules/identity/           # match the AppModule's existing import path — check it
├── identity.module.ts
├── identity.controller.ts
├── identity.service.ts
└── dto/register-identity.dto.ts
```

**`POST /v1/identities/challenge`**
Body `{ publicKey }` → generate 32 random bytes, store in Redis at `challenge:<publicKey>` with **5-minute TTL and single-use semantics** (delete on consumption — a replayable challenge defeats the point of proof-of-possession). Return `{ nonce }` (base64).

**`POST /v1/identities/register`**
Body `{ publicKey, challengeSignature, platform, deviceAttestationToken? }`:
1. Fetch the challenge from Redis; missing/expired → 400. **Delete it immediately** (single-use).
2. Verify `challengeSignature` is a valid Ed25519 signature over the nonce bytes, using `publicKey` — via `@antiai/attestation-core`, not a local nacl call. This is the proof-of-possession step and the entire reason the endpoint exists.
3. Validate `publicKey` is a well-formed 32-byte Ed25519 key (base64, correct length). **The brigade sim's `'mock-' + randomUUID()` must be structurally rejected here** — that string is the fossil of the shortcut, and this validation is what makes the shortcut impossible to repeat.
4. `deviceAttestationToken` present → verify (App Attest / Play Integrity) → set `deviceAttested: true`. Absent → `deviceAttested: false`. Extension and web keys are always `false`; only the mobile app earns platformFactor 1.0.
5. Derive `keyId` = first 16 bytes of `sha256(publicKey)`, hex. **Must match the derivation in `attestation-core`** — if the API derives keyIds differently from clients, every ingestion lookup misses. Import the shared function; do not reimplement.
6. Create `VerifierIdentity` with `status: PROBATION`, `reputation: cfg.params.initialReputation`. Duplicate publicKey → return the existing identity (idempotent registration).

**`GET /v1/identities/:keyId`** — public profile: `identityClass`, `status`, `attestationCount`, `displayHandle`. **Never `reputation`** (raw R is a measurement oracle for attackers; passport percentile bands come later).

---

## Step 2 — `foundation.e2e-spec.ts` — the first real proof (½ day)

This test is the definition of "Phase 1 works." It should have existed in week 2. Everything before it is a claim.

```typescript
// apps/api/test/foundation.e2e-spec.ts
it('completes the golden path: keygen → challenge → register → sign → submit → row', async () => {
  const kp = nacl.sign.keyPair();                                  // real Ed25519, no mocks
  const publicKey = toBase64(kp.publicKey);

  const { nonce } = await POST('/v1/identities/challenge', { publicKey });
  const challengeSignature = toBase64(nacl.sign.detached(fromBase64(nonce), kp.secretKey));
  const { keyId } = await POST('/v1/identities/register',
    { publicKey, challengeSignature, platform: 'web' });
  expect(keyId).toBe(deriveKeyId(publicKey));                       // shared derivation, both sides

  const payload = buildPayload({ keyId, subjectHash, claim: provenanceClaim });
  const signed = signAttestation(payload, kp.secretKey);            // attestation-core, same as clients
  const res = await POST('/v1/attestations', signed);
  expect(res.status).toBe(201);

  const row = await prisma.attestation.findUnique({ where: { payloadHash: signed.payloadHash } });
  expect(row).not.toBeNull();
  expect(row.attesterId).toBeDefined();
});
```

Negative cases in the same spec — each one asserts a guard that has never been proven to fire:
- Register with a signature over the *wrong* nonce → 400.
- Reuse a consumed challenge → 400.
- Submit an attestation from an unregistered keyId → 403 `ATT_UNKNOWN_KEY`.
- Submit with a one-bit-mutated signature → 401 `ATT_BAD_SIGNATURE`.
- Submit with a one-bit-mutated payload (stale payloadHash) → 400 `ATT_HASH_MISMATCH`.
- Submit with `clientTimestamp` 20 minutes old → 422 `ATT_TIMESTAMP_SKEW`.
- Submit the same envelope twice → both return the same id, second flagged `duplicate: true`.
- Submit a `custody_sealed` claim → 403 `ATT_DOMAIN_FORBIDDEN`.

**Plus the route-liveness guard** (the twenty lines that make report-fiction impossible):
```typescript
describe('claimed routes exist', () => {
  test.each([
    ['POST', '/v1/identities/challenge'], ['POST', '/v1/identities/register'],
    ['GET',  '/v1/identities/test-key'],  ['POST', '/v1/attestations'],
    ['POST', '/v1/subjects/resolve'],     ['GET',  '/v1/subjects/test-hash'],
  ])('%s %s is not 404', async (method, path) => {
    const res = await request(app.getHttpServer())[method.toLowerCase()](path).send({});
    expect(res.status).not.toBe(404);     // 400/401/403 all fine — 404 means it doesn't exist
  });
});
```

---

## Step 3 — Verify what the audit only located (1–2 days)

The audit confirmed these files *exist*. None are proven. In priority order:

| Component | Proof required |
|---|---|
| `subjects/resolve` | E2E: register → submit → resolve by exact hash → returns subject; resolve by pHash within distance 8 → perceptual match; pHash-only miss → creates **no** subject |
| Aggregation + reducers | E2E: two attestations → job runs → `verdictSummary` written; the pinned MACHINE_VERIFIED-beats-volume fixture test actually executes |
| Provenance worker | Integration: real job → fixture HTTPS server → pHash compare → `MACHINE_VERIFIED`; SSRF attack matrix green (from step 0) |
| Rate limiter | Integration against real Redis: 6th request in a minute → 429; PROBATION halved; concurrent burst never exceeds limit |
| Ledger | **Move the replay-determinism test out of `run-exit-gate.ts` into `ledger.spec.ts`.** Logic living in a script that CI never invokes is not a test — that's how it stayed green while unverified |
| Settlement / canaries / clustering / decay | Unit tests per the Phase 2 spec — classification matrix cell-by-cell, cycle-proof propagation, compression fixtures |

Rule for this step: any component that reaches step 4 without a named passing test is reported as **unverified**, not as done. Partial honesty beats a clean fiction.

---

## Step 4 — Rebuild the brigade sim on real registration (1 day)

Delete the `prisma.verifierIdentity.create` path entirely. The rewritten sim must:

1. Generate 60 real Ed25519 keypairs (3 cohorts × 20).
2. Register each through `POST /challenge` → sign → `POST /register`. Real HTTP, real proof-of-possession, real `platform: 'web'` → `deviceAttested: false` → platformFactor 0.6, no exceptions.
3. Register 3 honest identities. **They start at PROBATION/R=0.10 like everyone else** — to reach R≈0.95 they must earn it through ledger events (settlements/canaries), not a seeded column. If the sim writes `reputation: 0.95` directly, it's the same shortcut wearing a different hat. Either drive real settlements or state explicitly in the output that honest reputation was seeded and the margin figure is therefore hypothetical.
4. Drive attestation behavior via `POST /v1/attestations` with real signed envelopes — naive (same 10-min burst), patient (staggered registration, synchronized burst), careful (temporally spread, identical portfolios).
5. Run the real `ClusteringWorker`; assert it *produces* `CorrelationCluster` rows with ≥2 signals for naive and patient.
6. Run aggregation; capture `ShadowVerdictDiff` and per-user effective weights.

**Expected honest outcome:** naive and patient detected; careful evades on 1 signal (SimHash only). Document the evasion as a known limitation with its real cost (~146 staggered identities against three R=0.95 verifiers; roughly half that against R=0.6 verifiers, which is what early production actually looks like).

Shadow mode stays **off** until this passes through the front door.

---

## Step 5 — Make the failure mode structural (½ day)

- CI runs `pnpm turbo run test` on every PR; **red build blocks merge**. No exceptions, no `--passWithNoTests`.
- `foundation.e2e-spec.ts` (incl. the route-liveness table) runs on every PR against ephemeral Postgres + Redis in the CI job.
- **Coverage floor on the ingestion path** (`attestations/`, `identity/`, `provenance-worker/ssrf-guard.ts`) — set at whatever step 3 actually achieves, then ratchet only upward. Prevents silent regression to zero.
- **Reports quote test output, never prose.** A completion report contains the CI run link and pasted test names + results, or it isn't a completion report. The machine says done; the report transcribes it.

---

## Sizing Summary

| Step | Work | Days |
|---|---|---|
| 0 | Test runner + triage two dead tests | 0.5–1 |
| 1 | Identities module | 1–2 |
| 2 | `foundation.e2e-spec.ts` + route liveness | 0.5 |
| 3 | Verify existing components | 1–2 |
| 4 | Brigade sim through the front door | 1 |
| 5 | CI gates | 0.5 |
| | **Total** | **5–8 days** |

Unknown: step 0's triage. If the SSRF guard or the pHash repository fail their first real execution, add time — those are correctness problems in security-critical and architecture-critical code, and they're exactly what the audit could not see.

## What survives untouched

The Prisma schema. The reputation curves, slashing asymmetry, and vouch propagation design. The pure reducers and the evidence-beats-volume invariant. The compression math. The SSRF threat model. The clustering signal design. The transparency-log and Circle PKI architecture. Every spec written to date.

The design was never the problem. The problem was that "done" meant a report said so. Step 5 is the only permanent fix; steps 0–4 are paying off the debt that definition accrued.
