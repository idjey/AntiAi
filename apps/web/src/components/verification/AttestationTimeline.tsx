import React, { useState } from 'react';
import { fromBase64, verifyDetached } from '@antiai/attestation-core';
import { CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';

interface AttestationItem {
  id: string;
  payloadHash: string;
  version: string;
  claimType: string;
  claimPayload: any;
  receivedAt: string;
  signature: string;
  nonce: string;
  payloadB64: string | null;
  attester: {
    keyId: string;
    publicKey: string;
    status: string;
  };
}

interface AttestationTimelineProps {
  attestations: AttestationItem[];
}

export function AttestationTimeline({ attestations }: AttestationTimelineProps) {
  const [verifying, setVerifying] = useState<Record<string, 'idle' | 'valid' | 'invalid'>>({});

  const handleVerify = (item: AttestationItem) => {
    if (!item.payloadB64) return;
    
    try {
      // 1. Decode verbatim bytes directly from the stored Base64 payload
      const bytes = fromBase64(item.payloadB64);
      
      // 2. Convert public key from Base64 (API representation) to hex for verifyDetached
      // Note: We use the key bound to this keyId, assuming keys do not rotate (v1).
      // If rotation is added, this must be the key valid at `receivedAt`.
      const publicKeyBytes = fromBase64(item.attester.publicKey);
      const publicKeyHex = Array.from(publicKeyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // 3. Verify exactly against the decoded bytes, no JSON.parse() re-serialization.
      const isValid = verifyDetached(bytes, item.signature, publicKeyHex);
      
      setVerifying(prev => ({ ...prev, [item.id]: isValid ? 'valid' : 'invalid' }));
    } catch (err) {
      console.error('Verification failed', err);
      setVerifying(prev => ({ ...prev, [item.id]: 'invalid' }));
    }
  };

  return (
    <div className="bg-surface/50 border border-border/50 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-brand-blue" />
        <h3 className="text-xl font-medium text-text-primary">Community Attestations</h3>
      </div>
      
      {attestations.length === 0 ? (
        <div className="text-text-secondary text-center py-8">
          No community attestations found for this content yet.
        </div>
      ) : (
        <div className="space-y-4">
          {attestations.map((item) => {
            const status = verifying[item.id] || 'idle';
            const isLegacy = !item.payloadB64;
            
            return (
              <div key={item.id} className="bg-background border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-primary bg-surface py-1 px-2 rounded">
                      {item.claimType}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {new Date(item.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-text-secondary mt-2">
                    Verifier ID: <code className="bg-surface px-1.5 py-0.5 rounded text-xs break-all">{item.attester.keyId}</code>
                  </div>
                  
                  {/* Parse only for UI display, never for verification math */}
                  {item.payloadB64 && (
                    <div className="mt-2 text-xs text-text-tertiary">
                      <details>
                        <summary className="cursor-pointer hover:text-text-secondary">View Decoded Payload</summary>
                        <pre className="mt-2 p-2 bg-surface rounded overflow-x-auto text-[10px]">
                          {(() => {
                            try {
                              const jsonStr = new TextDecoder().decode(fromBase64(item.payloadB64));
                              return JSON.stringify(JSON.parse(jsonStr), null, 2);
                            } catch {
                              return 'Invalid payload formatting';
                            }
                          })()}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  {isLegacy ? (
                    <div className="flex items-center gap-2 text-xs text-text-tertiary bg-surface/50 px-3 py-2 rounded-lg" title="Legacy attestations did not store the verbatim canonical bytes required for client-side math.">
                      <AlertCircle className="w-4 h-4" />
                      <span>Verification unavailable (Legacy)</span>
                    </div>
                  ) : status === 'idle' ? (
                    <button 
                      onClick={() => handleVerify(item)}
                      className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm font-medium transition-colors"
                    >
                      Verify Signature
                    </button>
                  ) : status === 'valid' ? (
                    <div className="flex items-center gap-2 text-brand-green bg-brand-green/10 px-4 py-2 rounded-lg border border-brand-green/20">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Valid Signature</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-brand-red bg-brand-red/10 px-4 py-2 rounded-lg border border-brand-red/20">
                      <XCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Invalid Signature</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
