# Phase 1 Client Layer — Implementation Spec
## KeyOnboarding · Verdict Page · Contribution Quests

Targets the **confirmed** shipped API: `@Controller('v1/identities')` with `challenge`/`register`, and `POST /v1/attestations`. Two surfaces: `apps/web` (existing Next.js scaffold — build components in) and `apps/extension` (empty shell — scaffold from scratch). Shared signing logic lives in `@antiai/attestation-core`, never reimplemented per surface.

**Open item blocking implementation:** confirm whether the client signs the nonce *string* (UTF-8 bytes of the base64 text) or the *decoded* nonce bytes. The shipped `foundation.e2e-spec.ts` signs `Buffer.from(nonce, 'utf8')` — the string. The client spec below assumes **sign-the-string** to match that test; if the server verifies decoded bytes, flip the two marked lines. Do not guess — the e2e test is ground truth.

---

## 0. Shared: `@antiai/attestation-core` client surface

The package already exists and is golden-vector tested. The client needs these exports (add any that are missing, do not fork):

```typescript
generateKeyPair(): { publicKey: Uint8Array; secretKey: Uint8Array }
deriveKeyId(publicKeyB64: string): string          // MUST match server derivation
signAttestation(payload, secretKey): SignedAttestation
canonicalBytes(payload): Uint8Array                 // for any client-side re-verification
toBase64 / fromBase64 helpers
```

**Golden-vector conformance runs in each surface's own CI.** A test in `apps/web` and `apps/extension` that signs a known fixture payload *in that build environment* and asserts byte-identical output to `golden-vectors.json`. This is not optional and not covered by the package's own tests — browser `TextEncoder`/bundler transforms are exactly where cross-surface drift hides. If the extension's golden test passes, signing is trustworthy; if it's absent, signing is unverified regardless of what the package tests say.

---

## 1. KeyOnboarding — the sub-60-second flow

Same logic, two homes: a React component in `apps/web`, and the extension's install-time background flow. Both call the identical registration sequence.

### 1.1 The registration sequence (shared, in `attestation-core` or a thin client lib)

```typescript
async function onboardIdentity(platform: 'WEB' | 'EXTENSION'): Promise<OnboardResult> {
  // 1. Generate keypair
  const kp = generateKeyPair();
  const publicKeyB64 = toBase64(kp.publicKey);

  // 2. Request challenge
  const { nonce } = await api.post('/v1/identities/challenge', { publicKey: publicKeyB64 });

  // 3. Sign the challenge
  //    ⚠️ MATCH THE SERVER. Per foundation.e2e-spec.ts, sign the nonce STRING:
  const message = new TextEncoder().encode(nonce);          // sign-the-string
  //    If server verifies decoded bytes instead: const message = fromBase64(nonce);
  const challengeSignature = toBase64(nacl.sign.detached(message, kp.secretKey));

  // 4. Register
  const { keyId, status } = await api.post('/v1/identities/register', {
    publicKey: publicKeyB64,
    challengeSignature,
    platform,
    // deviceAttestationToken omitted — web/extension can't attest; both get platformFactor 0.6
  });

  // 5. Persist (see 1.2 / 1.3 — differs per surface)
  await persistKey({ secretKey: kp.secretKey, publicKeyB64, keyId, backupBlob: deriveBackup(kp) });

  return { keyId, status }; // status === 'PROBATION' expected
}
```

Total network cost: two round-trips. Onboarding UI shows "Generating identity…" through steps 1–4, then a success checkmark. Target < 60s is trivially met — the constraint is not to *block* on anything optional (backup UI, tutorials).

### 1.2 `apps/web` key persistence — IndexedDB, non-extractable intent

- Secret key in **IndexedDB** (not localStorage — Artifacts/security aside, localStorage is synchronous and size-limited; IndexedDB is the correct store for key material).
- Store an encrypted backup blob alongside (see 1.4).
- Web keys register `platform: 'WEB'`.

### 1.3 `apps/extension` key persistence — the pinned constraint

- Secret key in **`chrome.storage.local`** — **NEVER `chrome.storage.sync`.** Sync replicates across every device on the Google account, spraying the secret key through Google's servers. Pin this in code and in a comment; it's a one-word change away from a serious key-exposure bug.
- Generate on `chrome.runtime.onInstalled`.
- Register `platform: 'EXTENSION'`.
- Signing happens in the **background service worker**, never the content script — the content script runs in the page's context and must never see key material. Content script → `chrome.runtime.sendMessage` → background signs → returns signed envelope.

### 1.4 Backup — capability now, UI deferred (not the capability)

The hard-won lesson: `chrome.storage.local` / IndexedDB cleared = identity gone = reputation gone, unrecoverable. So backup material must **exist at generation time**, even if the user doesn't see the prompt immediately.

- At keygen, derive an encrypted backup blob (BIP39-style mnemonic, or the raw secret encrypted under a user passphrase) and store it beside the working key.
- Onboarding does **not** block on the user recording it.
- A **persistent, non-blocking "Back up your key" nudge** sits in the popup/header until acted on — password-manager pattern.
- **Never** ship keygen with no backup blob. Deferring the UI is fine; deferring the *existence* of recoverable material means a future "backup feature" can't recover keys already lost.

---

## 2. The Verdict Page (`apps/web`)

The shareable permalink and the share-sheet's web target. Route: `app/v/[hash]/page.tsx`. This is a **read** surface — it calls `GET /v1/subjects/:hash` and renders the layered verdict.

### 2.1 Layout — crypto verdict always leads, community fills the gap

```
┌─ VerdictBanner ────────────────────────────┐
│  ✅ Signed by creator   / ⚠️ Modified after  │
│  ❓ No proof exists      / 🚨 Impersonation   │   ← cryptoVerdict, ALWAYS top
├─ EvidencePanel (only when ❓ / community) ──┤
│  Provenance: [best match card, if any]      │   ← from verdictSummary
│  Flags: lip_desync ×3, audio_splice ×1      │
│  Context notes: [top 3 by net corroboration]│
│  "37 verifiers · 14 new accounts"           │   ← participation, honest metadata
│  Badge: "Early community signal — unweighted"│   ← signal: 'EARLY', never a %
├─ AttestationTimeline ──────────────────────┤
│  Chronological signed events                │
│  Each: [claim] [verifier keyId] [🔍 Verify] │   ← client-side sig re-verification
└─────────────────────────────────────────────┘
```

Components: `VerdictBanner`, `EvidencePanel`, `AttestationTimeline`.

### 2.2 Non-negotiable rendering rules (these encode the product's integrity)

1. **Crypto verdict always renders first and community signal never overrides it.** The banner reflects `cryptoVerdict`; `EvidencePanel` only appears to fill the ❓-no-proof gap. A ✅-signed video does not get "but 12 people flagged it" above the fold.
2. **No fake/real percentage. Ever.** Render evidence objects (provenance cards, flag counts, notes) — never a confidence bar. The `signal: 'EARLY'` field renders as literal copy: "unweighted early community signal." Percentages invite brigading; evidence invites scrutiny.
3. **`participation` metadata is shown honestly.** "14 flags from 3 accounts, all new" reads very differently from "14 flags from 14 established verifiers" — show `distinctAttesters` and the new-account share. This is weight-free context, not authority.
4. **The 🔍 Verify button re-verifies the signature client-side** via `attestation-core` (tweetnacl runs in-browser). "Don't trust our server — check the math" as a literal, working affordance. This requires `GET /v1/subjects/:hash/attestations` to return complete envelopes (`payload`, `payloadHash`, `signature`, `attesterPublicKey`).

### 2.3 Live updates

Poll `GET /v1/subjects/:hash` at 5s while the page is open, so a provenance quest resolving (PENDING → MACHINE_VERIFIED) feels live. SSE is a later nicety; polling a cached endpoint costs almost nothing.

---

## 3. Contribution Quests (`apps/web`)

The write surface — where users generate the organic attestations the shadow period needs. Three quest types, each producing a signed envelope via the shared signer. **First contribution triggers onboarding (§1) if no key exists** — the quest is the reason to onboard, so don't gate it behind a separate signup.

### 3.1 ProvenanceHuntForm — the machine-checkable quest

The highest-value contribution (only path to `MACHINE_VERIFIED`, highest reputation reward).

- Input: a URL the user believes is an earlier source.
- Client builds a `provenance_found` claim `{ sourceUrl }`, signs, submits to `POST /v1/attestations`.
- Optimistic UI: show a PENDING card immediately; poll the subject endpoint until the provenance worker resolves it to MACHINE_VERIFIED (pHash match) or leaves it PENDING.
- The URL is validated client-side as well-formed https only — the *real* SSRF defense is server-side in the isolated worker; the client check is just UX.

### 3.2 FrameFlagScrubber — timestamped artifact flags

- A `<video>` scrubber; user drops a pin at a timestamp and tags a category (lip_desync, audio_splice, lighting, hand_geometry…).
- Builds an `artifact_flag` claim `{ timestampMs, category, note? }`, signs, submits.
- Renders existing flags on the scrubber timeline so users corroborate rather than duplicate.

### 3.3 ContextNoteComposer — the miscaption case

- Free-text note + optional reference URLs → `context_note` claim.
- This is the "real footage, wrong context" case that crypto provenance alone can't catch, and it's the most common misinformation type — don't treat it as secondary.

### 3.4 The signing path (all three quests)

```
build claim payload (with attester.keyId, context.domain='public',
  fresh random nonce, current timestamp)
  → signAttestation(payload, secretKey)   [background worker in extension]
  → POST /v1/attestations { payload, payloadHash, signature }
  → handle: 201 (id, duplicate?) | 401/403/422 per error taxonomy
```

**Fresh random nonce per envelope and a real distinct subject hash** — the idempotency constraint is `[attesterId, subjectId, claimType, nonce]`; reusing nonces (as the sim's `'mock-nonce'` did) causes collisions that look like behavior bugs. The client generates 16 random bytes per attestation.

Surface the error taxonomy usefully: `ATT_TIMESTAMP_SKEW` → "your device clock is off, retrying" (auto-resign with server time from the 422 body); `ATT_RATE_LIMITED` → "slow down, try in a moment" with the `retryAfterMs`; `ATT_UNKNOWN_KEY` → re-run onboarding (key was cleared).

---

## 4. The Share-Sheet Path (context)

Mobile is out of scope for this spec (no mobile scaffold yet), but the web verdict page **is** the share-sheet's fallback target, so `app/v/[hash]` must render correctly from a cold load with only a hash — no assumed app state. Build it standalone-first.

---

## 5. Build Order & Verification

**Order:** (1) shared onboarding sequence + both surfaces' golden-vector CI tests → (2) web KeyOnboarding + persistence → (3) verdict page (read-only, testable against seeded attestations) → (4) quests (write path) → (5) extension scaffold reusing 1–2 and 4's signer.

Do web fully before the extension. The extension is empty and higher-friction (manifest, service worker, content-script messaging); proving the flow in the existing Next.js scaffold first means the extension is a port, not a first draft.

**Verification (each a committed test, per the standing rule):**
- Golden-vector conformance in *both* `apps/web` and `apps/extension` CI — signing produces byte-identical output to the fixture in-browser.
- **The onboarding e2e is the client analog of `foundation.e2e-spec.ts`:** in a headless browser, generate → challenge → register → assert `keyId` returned and `status: 'PROBATION'`. This proves the client talks to the real API, closing the loop that phantom-endpoint plans kept missing.
- Full contribution loop: onboard → build + sign a `provenance_found` claim → submit → assert 201 → assert the row via the API. The first time a *browser-signed* envelope is accepted end-to-end.
- Verdict page: render against a seeded subject with mixed attestations → assert crypto verdict leads, no percentage rendered, 🔍 Verify re-verifies a real signature client-side.
- `chrome.storage.sync` is never written — an import-lint or test asserting the extension writes only to `storage.local`.

**The number that matters:** the first browser-signed attestation accepted by `POST /v1/attestations`. That's the moment the client layer becomes real and organic traffic can start feeding the shadow period — which is the entire point of building this now.
