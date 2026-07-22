'use client';

import { useEffect } from 'react';
import { generateIdentity, signAttestation, toBase64, hexToBytes, fromBase64 } from '@antiai/attestation-core';
import nacl from 'tweetnacl';

export default function GoldenVectorTestPage() {
  useEffect(() => {
    // Expose a test function to the window for Playwright
    (window as any).runGoldenVectorTest = async (secretKeyBase64: string, payload: any) => {
      try {
        const secretKey = fromBase64(secretKeyBase64);
        const signed = signAttestation(payload, secretKey);
        
        return {
          success: true,
          signed,
        };
      } catch (e: any) {
        return {
          success: false,
          error: e.message,
        };
      }
    };
  }, []);

  return (
    <div>
      <h1>Golden Vector Test Environment</h1>
      <p>This page exposes window.runGoldenVectorTest for CI Playwright tests.</p>
    </div>
  );
}
