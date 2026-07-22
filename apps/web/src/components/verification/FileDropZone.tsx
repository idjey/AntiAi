'use client';

import React, { useCallback, useState } from 'react';

interface FileDropZoneProps {
  onFileSelected: (file: File) => void;
  progress?: number;
  error?: string | null;
  disabled?: boolean;
}

export function FileDropZone({ onFileSelected, progress, error, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  }, [onFileSelected, disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  }, [onFileSelected]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-white/20 bg-surface'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileChange}
          disabled={disabled}
        />
        
        {progress !== undefined && progress > 0 ? (
          <div className="space-y-4">
            <div className="text-xl font-bold">Processing File...</div>
            <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-200" 
                style={{ width: `${Math.round(progress * 100)}%` }} 
              />
            </div>
            <div className="text-sm text-text-secondary">{Math.round(progress * 100)}%</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold mb-2">Drop a file here to hunt for its source</div>
              <div className="text-sm text-text-secondary">Or click to browse. Images, videos, and PDFs supported.</div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
