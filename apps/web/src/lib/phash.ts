import blockhash from 'blockhash-core';
import { downscaleBoxFilter } from '@antiai/phash/dist/resize';

export interface FractionalHash {
    fraction: number;
    hash: string;
    version: number;
}

export async function extractFractionalSequence(file: File, fractions: number[]): Promise<FractionalHash[]> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        const results: FractionalHash[] = [];
        let fractionIndex = 0;

        video.addEventListener('loadedmetadata', () => {
            if (video.duration === Infinity || isNaN(video.duration)) {
                video.currentTime = 1e101; // trigger duration change
            } else {
                seekNext();
            }
        });

        video.addEventListener('durationchange', () => {
            if (video.duration !== Infinity && !isNaN(video.duration)) {
                video.currentTime = 0; // reset
                seekNext();
            }
        });

        video.addEventListener('seeked', () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas 2d not supported');

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                // Shared resizing logic from packages/phash
                const resizedData = downscaleBoxFilter(
                    imageData.data,
                    imageData.width,
                    imageData.height,
                    32,
                    32
                );

                const hashBits = blockhash.bmvbhash(
                    { width: 32, height: 32, data: resizedData },
                    8
                );
                
                results.push({
                    fraction: fractions[fractionIndex],
                    hash: hashBits,
                    version: 1
                });

                fractionIndex++;
                if (fractionIndex < fractions.length) {
                    seekNext();
                } else {
                    URL.revokeObjectURL(video.src);
                    resolve(results);
                }
            } catch (err) {
                reject(err);
            }
        });

        video.addEventListener('error', (e) => reject(video.error || e));

        function seekNext() {
            if (fractionIndex < fractions.length) {
                video.currentTime = video.duration * fractions[fractionIndex];
            }
        }
    });
}
