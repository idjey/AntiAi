'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDropZone } from '@/components/verification/FileDropZone';

export default function ProvenanceHuntPage() {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Hash the file client-side
      const { hashFile } = await import('@antiai/attestation-core');
      const hash = await hashFile(file, (p) => setProgress(p * 0.5)); // 0-50% for local hashing

      let perceptualHash: string | undefined;
      const isImage = file.type.startsWith('image/');
      
      let mediaType = 'OTHER';
      if (isImage) mediaType = 'IMAGE';
      else if (file.type.startsWith('video/')) mediaType = 'VIDEO';
      else if (file.type.startsWith('audio/')) mediaType = 'AUDIO';
      else if (file.type === 'application/pdf') mediaType = 'PDF';

      // 2. If it's an image, request pHash from server
      if (isImage) {
        if (file.size > 25 * 1024 * 1024) {
          console.warn('Image too large for perceptual hashing, proceeding with exact hash only');
        } else {
          setProgress(0.6);
          const formData = new FormData();
          formData.append('file', file);
          
          const phashRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/subjects/phash`, {
            method: 'POST',
            body: formData,
          });

          if (phashRes.ok) {
            const data = await phashRes.json();
            perceptualHash = data.perceptualHash;
          } else {
            console.warn('Failed to compute perceptual hash, proceeding with exact hash only', phashRes.status);
          }
        }
      }

      setProgress(0.8);

      // 3. Resolve the subject
      const resolveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/subjects/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hash,
          perceptualHash,
          mediaType,
        }),
      });

      if (!resolveRes.ok) {
        throw new Error('Failed to resolve subject');
      }

      setProgress(1.0);

      // 4. Redirect to the minimal host page
      router.push(`/v/${hash}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while processing the file.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary pb-2">
          Find the Source
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Help map the provenance of digital media. Drop a file to see if it's been verified, or add your own claim if you know where it came from.
        </p>
        
        <FileDropZone 
          onFileSelected={handleFileSelected} 
          progress={progress} 
          error={error} 
          disabled={isProcessing} 
        />
      </div>
    </div>
  );
}
