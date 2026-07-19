import xxhash from 'xxhash-wasm';

export class MinHash {
  private numPermutations: number;
  private hasher: (input: string, seedHigh?: number, seedLow?: number) => string;

  private constructor(numPermutations: number, hasher: any) {
    this.numPermutations = numPermutations;
    this.hasher = hasher;
  }

  static async create(numPermutations: number = 128): Promise<MinHash> {
    const { h64 } = await xxhash();
    return new MinHash(numPermutations, h64);
  }

  /**
   * Generate a minhash signature for a set of items (e.g., attestation target URLs)
   */
  computeSignature(items: string[]): bigint[] {
    const signature = new Array(this.numPermutations).fill(0n);
    
    const MAX_U64 = (1n << 64n) - 1n;
    for (let i = 0; i < this.numPermutations; i++) {
      signature[i] = MAX_U64;
    }

    for (const item of items) {
      for (let i = 0; i < this.numPermutations; i++) {
        const hexHash = this.hasher(item, 0, i);
        const hashVal = BigInt('0x' + hexHash);
        
        if (hashVal < signature[i]) {
          signature[i] = hashVal;
        }
      }
    }
    
    return signature;
  }

  /**
   * Calculate Jaccard similarity estimate between two signatures
   */
  estimateJaccard(sig1: bigint[], sig2: bigint[]): number {
    if (sig1.length !== sig2.length) throw new Error("Signatures must have same length");
    if (sig1.length === 0) return 0;
    
    let matches = 0;
    for (let i = 0; i < sig1.length; i++) {
      if (sig1[i] === sig2[i]) matches++;
    }
    
    return matches / sig1.length;
  }
}
