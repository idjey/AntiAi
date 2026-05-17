import {
    generateKeyPair,
    getPublicKey,
    buildCanonicalPayload,
    signProof,
    verifyProof,
    verifySignature,
    ProofPayload,
} from './signing';

describe('Crypto Signing Module', () => {
    let keyPair: { privateKeyB64: string; publicKeyB64: string };
    const testVideoId = 'dQw4w9WgXcQ';
    const testChannelId = 'UCuAXFkgsw1L7zawG0iWMQKg';
    const testKid = 'k_2026_01';

    beforeAll(async () => {
        keyPair = await generateKeyPair();
    });

    describe('Key Generation', () => {
        it('should generate a valid key pair', () => {
            expect(keyPair).toBeDefined();
            expect(keyPair.privateKeyB64).toBeDefined();
            expect(keyPair.publicKeyB64).toBeDefined();
        });

        it('should derive the correct public key from a private key', async () => {
            const derivedPubKey = await getPublicKey(keyPair.privateKeyB64);
            expect(derivedPubKey).toBe(keyPair.publicKeyB64);
        });
    });

    describe('Payload Building', () => {
        it('should build a valid canonical payload', () => {
            const expiresAtUnix = Math.floor(Date.now() / 1000) + 3600;
            const contentHash = 'abcd1234hash';

            const { payload, canonicalJson, payloadBytes } = buildCanonicalPayload({
                kid: testKid,
                youtubeVideoId: testVideoId,
                youtubeChannelId: testChannelId,
                expiresAtUnix,
                contentHash,
            });

            expect(payload.v).toBe(1);
            expect(payload.iss).toBe('antiai.me');
            expect(payload.kid).toBe(testKid);
            expect(payload.youtube_video_id).toBe(testVideoId);
            expect(payload.youtube_channel_id).toBe(testChannelId);
            expect(payload.content_hash).toBe(contentHash);
            expect(payload.nonce).toHaveLength(22); // 16 bytes base64url is 22 chars

            expect(typeof canonicalJson).toBe('string');
            expect(payloadBytes).toBeInstanceOf(Uint8Array);
        });

        it('should throw an error if expiration is in the past', () => {
            const pastUnix = Math.floor(Date.now() / 1000) - 3600;
            expect(() => {
                buildCanonicalPayload({
                    kid: testKid,
                    youtubeVideoId: testVideoId,
                    youtubeChannelId: testChannelId,
                    expiresAtUnix: pastUnix,
                });
            }).toThrow('exp must be > iat');
        });
    });

    describe('Signing and Verification', () => {
        let signedProof: any;

        beforeAll(async () => {
            signedProof = await signProof({
                kid: testKid,
                youtubeVideoId: testVideoId,
                youtubeChannelId: testChannelId,
                expiresAt: Date.now() + 3600000, // 1 hour from now
                privateKeyB64: keyPair.privateKeyB64,
            });
        });

        it('should sign a proof correctly', () => {
            expect(signedProof).toBeDefined();
            expect(signedProof.alg).toBe('Ed25519');
            expect(signedProof.kid).toBe(testKid);
            expect(signedProof.signature_b64).toBeDefined();
            expect(signedProof.payload_b64).toBeDefined();
        });

        it('should successfully verify a valid proof', async () => {
            const result = await verifyProof({
                payload_b64: signedProof.payload_b64,
                signature_b64: signedProof.signature_b64,
                publicKeyB64: keyPair.publicKeyB64,
                expectedVideoId: testVideoId,
                expectedChannelId: testChannelId,
            });

            expect(result.ok).toBe(true);
            expect(result.status).toBe('verified');
            expect(result.payload?.youtube_video_id).toBe(testVideoId);
        });

        it('should fail verification if video ID does not match', async () => {
            const result = await verifyProof({
                payload_b64: signedProof.payload_b64,
                signature_b64: signedProof.signature_b64,
                publicKeyB64: keyPair.publicKeyB64,
                expectedVideoId: 'wrongVideoId',
                expectedChannelId: testChannelId,
            });

            expect(result.ok).toBe(false);
            expect(result.reason).toBe('video_id_mismatch');
        });

        it('should fail verification with wrong public key', async () => {
            const wrongKeyPair = await generateKeyPair();
            const result = await verifyProof({
                payload_b64: signedProof.payload_b64,
                signature_b64: signedProof.signature_b64,
                publicKeyB64: wrongKeyPair.publicKeyB64,
                expectedVideoId: testVideoId,
            });

            expect(result.ok).toBe(false);
            expect(result.reason).toBe('bad_signature');
        });

        it('should quickly verify signature without payload inspection', async () => {
            const isOk = await verifySignature({
                payload_b64: signedProof.payload_b64,
                signature_b64: signedProof.signature_b64,
                publicKeyB64: keyPair.publicKeyB64,
            });
            expect(isOk).toBe(true);
        });
    });
});
