'use client';

import React from 'react';

interface SubjectSummaryProps {
  subject: any;
  attestations: any[];
}

export function SubjectSummary({ subject, attestations }: SubjectSummaryProps) {
  if (!subject) return <div className="p-4 rounded-xl bg-surface">Subject not found.</div>;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-surface border border-white/10">
        <h2 className="text-2xl font-bold mb-4">Subject Details</h2>
        <div className="space-y-2">
          <div><span className="text-text-secondary">Hash:</span> {subject.hash}</div>
          <div><span className="text-text-secondary">Type:</span> {subject.mediaType}</div>
          {subject.perceptualHash && (
            <div><span className="text-text-secondary">pHash:</span> {subject.perceptualHash}</div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-xl bg-surface border border-white/10">
        <h2 className="text-2xl font-bold mb-4">Attestations ({attestations.length})</h2>
        {attestations.length === 0 ? (
          <p className="text-text-secondary">No attestations found for this subject yet.</p>
        ) : (
          <div className="space-y-4">
            {attestations.map((att, i) => (
              <div key={i} className="p-4 rounded-lg bg-white/5">
                <div className="text-sm text-text-secondary mb-2">Signer: {att.signerKeyId}</div>
                <div className="font-mono text-sm">{JSON.stringify(att.payload, null, 2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
