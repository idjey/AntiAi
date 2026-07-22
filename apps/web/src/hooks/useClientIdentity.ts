'use client';

import { useState, useEffect } from 'react';
import { loadIdentity } from '@antiai/attestation-core/client';
import type { SignKeyPair } from 'tweetnacl';

export function useClientIdentity() {
  const [identity, setIdentity] = useState<{
    id: string;
    secretKey: Uint8Array;
    publicKey: Uint8Array;
    mnemonic: string;
    keyId: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdentity() {
      try {
        const id = await loadIdentity();
        setIdentity(id || null);
      } catch (e) {
        console.error('Failed to load identity', e);
      } finally {
        setLoading(false);
      }
    }
    fetchIdentity();
  }, []);

  return { identity, loading };
}
