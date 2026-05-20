import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';

export function hashPayload(payload: string | object): Uint8Array {
    let payloadStr = '';
    if (typeof payload === 'string') {
        payloadStr = payload;
    } else {
        payloadStr = JSON.stringify(payload);
    }
    const encoder = new TextEncoder();
    return sha256(encoder.encode(payloadStr));
}

export async function verifySignatureOffline(
    publicKeyHex: string,
    signatureHex: string,
    payload: string | object
): Promise<boolean> {
    try {
        const messageHash = hashPayload(payload);
        // ed.verify is used in v1.7.3
        const isValid = await ed.verify(signatureHex, messageHash, publicKeyHex);
        return isValid;
    } catch (e) {
        return false;
    }
}
