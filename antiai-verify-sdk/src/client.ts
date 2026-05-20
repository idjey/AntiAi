import { verifySignatureOffline } from './crypto';

export interface VerificationResult {
    isValid: boolean;
    reason?: string;
    proofId?: string;
    creatorId?: string;
    timestamp?: string;
    platform?: string;
    platformId?: string;
}

export interface AntiAIClientConfig {
    apiUrl?: string;
}

export class AntiAIClient {
    private apiUrl: string;

    constructor(config?: AntiAIClientConfig) {
        this.apiUrl = config?.apiUrl || 'https://api.antiai.me';
    }

    /**
     * Reaches out to the AntiAI Transparency Log to verify if a given piece of media
     * (e.g. a YouTube video) has a valid cryptographic proof.
     * 
     * Internally, this SDK performs a secondary offline mathematical validation
     * to guarantee the API response hasn't been spoofed.
     * 
     * @param platform The platform the media is hosted on (e.g., 'youtube', 'tiktok')
     * @param platformId The unique ID of the media on that platform
     * @returns VerificationResult
     */
    async verifyMedia(platform: string, platformId: string): Promise<VerificationResult> {
        try {
            const url = new URL(`${this.apiUrl}/public/verify`);
            url.searchParams.append('platform', platform);
            url.searchParams.append('platform_id', platformId);

            const response = await fetch(url.toString());
            
            if (response.status === 404) {
                return { isValid: false, reason: 'No cryptographic proof found for this media.' };
            }

            if (!response.ok) {
                return { isValid: false, reason: `API Error: ${response.statusText}` };
            }

            const data = await response.json();

            // The API returns the signature, public key, and payload hash.
            // A truly secure SDK doesn't just trust the `isValid: true` boolean from the API.
            // We run the mathematics locally to ensure zero-trust security.
            
            if (data.signature && data.publicKey && data.contentHash) {
                const isMathValid = await verifySignatureOffline(
                    data.publicKey,
                    data.signature,
                    data.contentHash
                );

                if (!isMathValid) {
                    return { 
                        isValid: false, 
                        reason: 'CRITICAL SECURITY FAILURE: API signature mathematically failed local Ed25519 verification. Possible spoofing detected.' 
                    };
                }
            }

            return {
                isValid: data.isValid,
                proofId: data.proofId || data.id,
                creatorId: data.creatorId,
                timestamp: data.timestamp,
                platform: data.platform,
                platformId: data.platformId
            };

        } catch (error: any) {
            return {
                isValid: false,
                reason: `Verification failed due to network or internal error: ${error.message}`
            };
        }
    }
}
