export interface IKmsClient {
  sign(payload: Buffer, keyId: string, alg: string): Promise<string>;
}
