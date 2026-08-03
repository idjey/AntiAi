import blockhash from 'blockhash-core';
import { downscaleBoxFilter } from '../../../packages/phash/src/resize';
import { PHASH_CONSTANTS } from '../../../packages/phash/src/constants';

export interface FractionalHash {
    fraction: number;
    hash: string;
    version: number;
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
    return new Promise((resolve) => {
        const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            let resolved = false;
            
            if ('requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                });
            }
            
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            }, 150);
        };
        video.addEventListener('seeked', onSeeked);
        video.currentTime = time;
    });
}

export async function extractFractionalSequence(video: HTMLVideoElement, fractions: number[]): Promise<FractionalHash[]> {
    if (!video.duration || !isFinite(video.duration)) {
        throw new Error("Invalid video duration");
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Could not get 2D context");

    const results: FractionalHash[] = [];

    const originalTime = video.currentTime;

    try {
        for (const fraction of fractions) {
            const targetTime = video.duration * fraction;
            await seekVideo(video, targetTime);
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const downscaled = downscaleBoxFilter(
                imageData.data as unknown as Uint8Array,
                canvas.width,
                canvas.height,
                32,
                32
            );
            
            const hash = blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as unknown as number[] }, 8);
            
            results.push({
                fraction,
                hash,
                version: PHASH_CONSTANTS.VERSION
            });
        }
    } finally {
        // Restore playback
        video.currentTime = originalTime;
    }
    
    return results;
}
