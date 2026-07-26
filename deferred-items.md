# Deferred / Known Limitations

## 1. Perceptual Verification (pHash)
- **Constraint:** Production proofs currently carry `null` or a placeholder for `perceptualHash` until the client-side frame extraction is built. 
- **Consequence:** A proof signed now with a null/placeholder pHash is immutable. When perceptual verification ships, every proof issued in the interim will be perceptually-unverifiable and will need reissuance to gain a real pHash.

## 2. Legacy Attestations (`payloadB64: null`)
- **Constraint:** Attestations ingested before the introduction of the `payloadB64` column (which anchors exact canonical bytes) cannot be verified client-side via exact mathematical signature match, because their original exact bytes weren't preserved.
- **Consequence:** These older legacy attestations will permanently show "Verification unavailable (Legacy)" in the UI. This is the honest fallback state for items whose mathematical provenance can no longer be cryptographically proven client-side. This is not a bug.

- [ ] **pHash Synthetic Corpus Validation**: Threshold of 12 was validated on a synthetic corpus. Re-validate against real transcodes (YouTube VP9/AV1 codec artifacts) and similar-content collisions (news broadcasts, gameplay) once production proofs accumulate. Config-driven threshold is necessary for tuning.
- [ ] **pHash Collision Probability at Scale**: 64-bit hash chosen for schema alignment at launch. Revisit at scale (e.g., millions of proofs) where collision probability warrants upgrading to the 256-bit hash (16x16).
