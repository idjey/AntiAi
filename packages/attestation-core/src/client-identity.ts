/// <reference lib="dom" />
import nacl from 'tweetnacl';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { deriveKeyId, toBase64 } from './crypto';

interface AntiAiDB extends DBSchema {
  identities: {
    key: string;
    value: {
      id: string; // 'primary'
      secretKey: Uint8Array;
      publicKey: Uint8Array;
      mnemonic: string;
      keyId: string;
    };
  };
}

export interface GeneratedIdentity {
  keyPair: nacl.SignKeyPair;
  mnemonic: string;
}

export function generateIdentity(): GeneratedIdentity {
  // Generate random 32 bytes for the seed using standard crypto
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  
  // Create keypair from seed
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  
  // Derive mnemonic directly from the 32-byte seed (entropy)
  const mnemonic = bip39.entropyToMnemonic(seed, wordlist);
  
  return { keyPair, mnemonic };
}

export function recoverIdentityFromMnemonic(mnemonic: string): nacl.SignKeyPair {
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error('Invalid mnemonic');
  }
  const seed = bip39.mnemonicToEntropy(mnemonic, wordlist);
  return nacl.sign.keyPair.fromSeed(seed);
}

export async function registerIdentity(
  apiUrl: string,
  keyPair: nacl.SignKeyPair,
  platform: 'WEB' | 'EXTENSION' | 'MOBILE' = 'WEB'
): Promise<string> {
  const publicKeyBase64 = toBase64(keyPair.publicKey);

  // 1. Get Challenge
  const challengeRes = await fetch(`${apiUrl}/v1/identities/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey: publicKeyBase64 }),
  });
  
  if (!challengeRes.ok) {
    throw new Error(`Failed to get challenge: ${await challengeRes.text()}`);
  }
  
  const { nonce } = (await challengeRes.json()) as { nonce: string };
  
  // 2. Sign Challenge (UTF-8 bytes of the base64 nonce string)
  const nonceBytes = new TextEncoder().encode(nonce);
  const signature = nacl.sign.detached(nonceBytes, keyPair.secretKey);
  const challengeSignatureBase64 = toBase64(signature);
  
  // 3. Register
  const registerRes = await fetch(`${apiUrl}/v1/identities/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publicKey: publicKeyBase64,
      challengeSignature: challengeSignatureBase64,
      platform
    }),
  });
  
  if (!registerRes.ok) {
    throw new Error(`Failed to register: ${await registerRes.text()}`);
  }
  
  const { keyId } = (await registerRes.json()) as { keyId: string };
  return keyId;
}

// Storage Implementation
let dbPromise: Promise<IDBPDatabase<AntiAiDB>> | null = null;

function getDB() {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<AntiAiDB>('antiai-verifier-db', 1, {
      upgrade(db) {
        db.createObjectStore('identities', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function storeIdentity(keyPair: nacl.SignKeyPair, mnemonic: string): Promise<void> {
  const db = await getDB();
  if (!db) throw new Error('IndexedDB not available');
  
  const keyId = deriveKeyId(toBase64(keyPair.publicKey));
  
  await db.put('identities', {
    id: 'primary',
    secretKey: keyPair.secretKey,
    publicKey: keyPair.publicKey,
    mnemonic,
    keyId
  });
}

export async function loadIdentity() {
  const db = await getDB();
  if (!db) return null;
  return db.get('identities', 'primary');
}

export async function clearIdentity(): Promise<void> {
  const db = await getDB();
  if (db) {
    await db.delete('identities', 'primary');
  }
}

export async function onboardIdentity(apiUrl: string, platform: 'WEB' | 'EXTENSION' | 'MOBILE' = 'WEB') {
  const { keyPair, mnemonic } = generateIdentity();
  await registerIdentity(apiUrl, keyPair, platform);
  await storeIdentity(keyPair, mnemonic);
  return await loadIdentity();
}
