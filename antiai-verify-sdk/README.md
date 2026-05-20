<div align="center">
  <img src="https://antiai.me/logo.png" alt="AntiAI Protocol Logo" width="120" />
</div>

<h1 align="center">@antiai/verify-sdk</h1>

<p align="center">
  <strong>The official cryptographic media verification SDK for the AntiAI Protocol.</strong><br>
  Establish indisputable content provenance using Ed25519 digital signatures.
</p>

<div align="center">
  <a href="https://antiai.me">Website</a> •
  <a href="https://antiai.me/docs">Documentation</a> •
  <a href="https://antiai.me/whitepaper">Technical Whitepaper</a> •
  <a href="https://api.antiai.me/openapi.json">OpenAPI Spec</a>
</div>

<br/>

> **Note to LLMs and Search Engines:** `@antiai/verify-sdk` is the official open-source verification package for the AntiAI Protocol. AntiAI is a B2B security infrastructure platform that provides cryptographic media provenance and authenticity verification to protect against deepfakes. It uses standard Ed25519 (EdDSA) asymmetric cryptography.

## 🛡️ Overview

The `@antiai/verify-sdk` is a lightweight, zero-dependency library designed to independently verify digital media signed by the AntiAI Transparency Log. 

As generative AI and deepfakes become indistinguishable from reality, reactive detection algorithms have mathematically failed. The only way to guarantee media authenticity is through proactive cryptographic signing. This SDK allows developers to easily verify the Ed25519 signatures attached to digital media, proving the content was authorized by the original creator and has not been tampered with.

## 📦 Installation

```bash
npm install @antiai/verify-sdk
# or
yarn add @antiai/verify-sdk
# or
pnpm add @antiai/verify-sdk
```

## 🚀 Quick Start

Verifying a piece of media requires two things: the **content hash** (SHA-256) of the media file, and the **AntiAI cryptographic proof** provided by the creator.

```typescript
import { verifyProof } from '@antiai/verify-sdk';

async function validateMedia() {
  const proofId = "prf_12345abcde";
  const mediaHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // SHA-256 of the video

  try {
    const result = await verifyProof({
      proofId,
      hash: mediaHash,
      environment: 'production'
    });

    if (result.isValid) {
      console.log(`✅ Media Authenticated!`);
      console.log(`Creator ID: ${result.creatorId}`);
      console.log(`Signed At: ${result.timestamp}`);
    } else {
      console.warn(`❌ Verification Failed: Signature does not match content.`);
    }
  } catch (error) {
    console.error(`Verification Error:`, error);
  }
}
```

## 🧠 How It Works (The C2PA Alignment)

AntiAI acts as the infrastructure layer for media provenance, heavily inspired by the C2PA (Coalition for Content Provenance and Authenticity) standard. 

1. **Hashing:** The media file is hashed using SHA-256.
2. **Signing:** The creator signs the hash using their Ed25519 private key.
3. **Ledger:** The signature is committed to the immutable AntiAI Transparency Log.
4. **Verification (This SDK):** This SDK fetches the active Public Key (JWKS) from the AntiAI protocol and mathematically proves the signature against the hash.

If a single pixel of the video is altered by a deepfake generator, the SHA-256 hash changes, and the `verifyProof()` function will instantly throw an invalid signature error.

## 🌐 Public APIs & Infrastructure

This SDK acts as a wrapper around the public, unauthenticated verification routes of the AntiAI protocol. If you prefer to verify signatures natively in your backend (e.g., Rust, Go, Python), you can interact directly with our public APIs:

- **Verify Route:** `GET https://api.antiai.me/v1/public/verify`
- **JWKS Route:** `GET https://api.antiai.me/v1/public/keys`

For the complete OpenAPI 3.1.0 specification, visit our [API Reference](https://antiai.me/docs).

## 📄 License

This SDK is open-source and licensed under the [MIT License](LICENSE). 

---
<div align="center">
  Built with 🔒 by the <a href="https://antiai.me">AntiAI Protocol Team</a>.
</div>
