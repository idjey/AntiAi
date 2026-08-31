const crypto = require('crypto');

// Generate an ES256 (P-256) key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1' // This is NIST P-256
});

// Export keys in DER format (SPKI for public, PKCS8 for private)
const pubDer = publicKey.export({ type: 'spki', format: 'der' });
const privDer = privateKey.export({ type: 'pkcs8', format: 'der' });

const pubB64 = pubDer.toString('base64');
console.log('Public Key (SPKI Base64):', pubB64);

const payload = Buffer.from('test payload');

// Sign with Node's crypto
const signature = crypto.sign('SHA256', payload, privateKey);
console.log('Signature length (DER):', signature.length);

// Verify with Node's crypto
const isVerified = crypto.verify(
  'SHA256', 
  payload, 
  crypto.createPublicKey({ key: Buffer.from(pubB64, 'base64'), format: 'der', type: 'spki' }), 
  signature
);

console.log('Is Verified?', isVerified);

// To convert DER signature to IEEE P1363 (64 bytes raw r|s)
// This is required for standard JWT/ES256 format
// Node 13.2.0+ supports dsaEncoding: 'ieee-p1363'
const signatureRaw = crypto.sign(null, payload, {
  key: privateKey,
  dsaEncoding: 'ieee-p1363'
});
console.log('Signature length (IEEE P1363):', signatureRaw.length);

const isVerifiedRaw = crypto.verify(null, payload, {
  key: publicKey,
  dsaEncoding: 'ieee-p1363'
}, signatureRaw);
console.log('Is Verified (IEEE P1363)?', isVerifiedRaw);
