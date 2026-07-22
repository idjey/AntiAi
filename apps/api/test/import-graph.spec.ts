import * as attestationCore from '@antiai/attestation-core';

describe('Import Graph Guard', () => {
  it('should not expose client-identity or @scure/bip39 in the main export', () => {
    // If it did, this file would fail to compile or run because of the ESM error.
    // We assert that 'onboardIdentity' is not present in the main export.
    expect(attestationCore).toBeDefined();
    expect((attestationCore as any).onboardIdentity).toBeUndefined();
  });
});
