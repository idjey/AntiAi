'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SubjectSummary } from '@/components/verification/SubjectSummary';
import { ProvenanceHuntForm } from '@/components/verification/ProvenanceHuntForm';

export default function MinimalHostPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [subject, setSubject] = useState<any>(null);
  const [attestations, setAttestations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjectData = async (isPolling: boolean = false) => {
    try {
      if (!isPolling) setLoading(true);
      setError(null);
      
      const [subRes, attRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/subjects/${hash}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/subjects/${hash}/attestations`)
      ]);

      if (!subRes.ok) throw new Error('Subject not found');
      
      const subData = await subRes.json();
      const attData = attRes.ok ? await attRes.json() : { items: [] };

      setSubject(subData);
      setAttestations(attData.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subject data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let pollCount = 0;
    const MAX_POLLS = 24; // 2 minutes at 5s intervals

    const poll = async () => {
      if (pollCount >= MAX_POLLS) {
        if (pollingInterval) clearInterval(pollingInterval);
        return;
      }
      pollCount++;
      await fetchSubjectData(true);
    };

    if (hash) {
      fetchSubjectData(false);
      pollingInterval = setInterval(poll, 5000);
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-text-secondary animate-pulse">Loading subject data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <SubjectSummary subject={subject} attestations={attestations} />
        </div>
        <div>
          <ProvenanceHuntForm subjectHash={hash} onSuccess={fetchSubjectData} />
        </div>
      </div>
    </div>
  );
}
