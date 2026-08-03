import blockhash from 'blockhash-core';
import { downscaleBoxFilter } from './resize';
import { PHASH_CONSTANTS } from './constants';

export interface FractionalHash {
    fraction: number;
    hash: string;
    version: number;
}

/**
 * Extracts frames at specific fractions of a video's duration, downscales them,
 * and computes their perceptual hashes using blockhash-core.
 * This runs entirely in the browser using the HTML5 Video and Canvas APIs.
 * 
 * @param videoSource A URL, File, or Blob representing the video.
 * @returns Array of fractional hashes.
 */
export async function extractFractionalSequence(videoSource: string | Blob, fractions: number[] = PHASH_CONSTANTS.ANCHOR_SETS[PHASH_CONSTANTS.VERSION as keyof typeof PHASH_CONSTANTS.ANCHOR_SETS]): Promise<FractionalHash[]> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.setAttribute('playsinline', '');
        video.style.position = 'absolute';
        video.style.opacity = '0.01';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);
        
        let url: string;
        if (typeof videoSource === 'string') {
            url = videoSource;
        } else {
            url = URL.createObjectURL(videoSource);
        }
        
        video.src = url;
        video.load();

        video.onloadedmetadata = async () => {
            if (!video.duration || !isFinite(video.duration)) {
                return reject(new Error("Invalid video duration"));
            }

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return reject(new Error("Could not get 2D context"));

            const results: FractionalHash[] = [];

            try {
                for (const fraction of fractions) {
                    const targetTime = video.duration * fraction;
                    console.log(`[PhashExtract] Seeking to ${targetTime} (fraction ${fraction} of ${video.duration})`);
                    await seekVideo(video, targetTime);
                    console.log(`[PhashExtract] Seek complete. Current time is now ${video.currentTime}`);
                    
                    // Draw frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Use the exact same resampler as the backend sharp pipeline!
                    const downscaled = downscaleBoxFilter(
                        imageData.data as unknown as Uint8Array,
                        canvas.width,
                        canvas.height,
                        32,
                        32
                    );
                    
                    // Compute hash
                    const hash = blockhash.bmvbhash({ width: 32, height: 32, data: downscaled as unknown as number[] }, 8);
                    
                    results.push({
                        fraction,
                        hash,
                        version: PHASH_CONSTANTS.VERSION
                    });
                }
                
                // Cleanup
                if (video.parentNode) {
                    video.parentNode.removeChild(video);
                }
                if (typeof videoSource !== 'string') {
                    URL.revokeObjectURL(url);
                }
                resolve(results);
            } catch (err) {
                reject(err);
            }
        };

        video.onerror = (e) => reject(new Error(`Video load error: ${e}`));
    });
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
            
            // Fallback: Headless Chromium suppresses requestVideoFrameCallback
            // if the tab is inactive or not rendering.
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
