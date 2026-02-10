const crypto = require('crypto');

// Generate Ed25519 key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');

// Export to DER (binary) then base64
// using pkcs8 for private and spki for public is standard for Node crypto
const privateKeyB64 = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64');
const publicKeyB64 = publicKey.export({ format: 'der', type: 'spki' }).toString('base64');

const fs = require('fs');

const content = 
`SIGNING_PRIVATE_KEY_B64="${privateKeyB64}"
SIGNING_PUBLIC_KEY_B64="${publicKeyB64}"`;

fs.writeFileSync('keys.txt', content);
console.log('Keys written to keys.txt');
