import { KMSClient, SignCommand, MessageType } from '@aws-sdk/client-kms';
import { IKmsClient } from './kms-client';

export class AwsKmsClient implements IKmsClient {
  private client: KMSClient;

  constructor(region: string = process.env.AWS_REGION || 'us-east-1', customEndpoint?: string) {
    this.client = new KMSClient({ 
      region,
      endpoint: customEndpoint,
    });
  }

  async sign(payload: Buffer, keyId: string, alg: string): Promise<string> {
    if (alg !== 'Ed25519') {
      throw new Error(`Unsupported algorithm: ${alg}`);
    }

    const command = new SignCommand({
      KeyId: keyId,
      Message: payload,
      MessageType: MessageType.RAW,
      // The AWS SDK defines this as a literal string or enum. 
      // Based on AWS documentation, it's 'ED25519_SHA_512' for Ed25519 keys.
      SigningAlgorithm: 'ED25519_SHA_512' as any,
    });

    const response = await this.client.send(command);
    
    if (!response.Signature) {
      throw new Error('No signature returned from KMS');
    }

    // response.Signature is a Uint8Array.
    // For Ed25519, AWS KMS returns the raw 64-byte signature.
    // We convert it to base64url.
    const rawSigB64 = Buffer.from(response.Signature).toString('base64');
    return rawSigB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}
