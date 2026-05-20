import * as ed from '@noble/ed25519';
import { verifySignatureOffline, hashPayload } from '../src/crypto';

describe('AntiAI Cryptography Engine', () => {
    let privateKey: Uint8Array;
    let publicKey: Uint8Array;
    let publicKeyHex: string;

    beforeAll(async () => {
        // Generate a random keypair for testing using noble 1.7.3
        privateKey = ed.utils.randomPrivateKey();
        publicKey = await ed.getPublicKey(privateKey);
        publicKeyHex = ed.utils.bytesToHex(publicKey);
    });

    it('should successfully verify a valid signature', async () => {
        const payload = 'youtube:123456';
        const messageHash = hashPayload(payload);
        const signature = await ed.sign(messageHash, privateKey);
        const signatureHex = ed.utils.bytesToHex(signature);

        const isValid = await verifySignatureOffline(publicKeyHex, signatureHex, payload);
        expect(isValid).toBe(true);
    });

    it('should fail verification if the payload has been altered (tampering protection)', async () => {
        const payload = 'youtube:123456';
        const messageHash = hashPayload(payload);
        const signature = await ed.sign(messageHash, privateKey);
        const signatureHex = ed.utils.bytesToHex(signature);

        // Attempt to verify the signature against a different payload
        const alteredPayload = 'youtube:123457';
        const isValid = await verifySignatureOffline(publicKeyHex, signatureHex, alteredPayload);
        
        expect(isValid).toBe(false);
    });

    it('should fail verification if signed by a different key (spoofing protection)', async () => {
        const maliciousPrivateKey = ed.utils.randomPrivateKey();
        const payload = 'youtube:123456';
        const messageHash = hashPayload(payload);
        
        // Malicious actor signs the real payload with their own key
        const maliciousSignature = await ed.sign(messageHash, maliciousPrivateKey);
        const maliciousSignatureHex = ed.utils.bytesToHex(maliciousSignature);

        // Attempt to verify using the original creator's public key
        const isValid = await verifySignatureOffline(publicKeyHex, maliciousSignatureHex, payload);
        
        expect(isValid).toBe(false);
    });

    it('should handle complex object payloads deterministically', async () => {
        const payloadObj = { videoId: '123', platform: 'youtube', author: 'dj' };
        const messageHash = hashPayload(payloadObj);
        const signature = await ed.sign(messageHash, privateKey);
        const signatureHex = ed.utils.bytesToHex(signature);

        const isValid = await verifySignatureOffline(publicKeyHex, signatureHex, payloadObj);
        expect(isValid).toBe(true);
    });
});
