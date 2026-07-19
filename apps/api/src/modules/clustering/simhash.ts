import xxhash from 'xxhash-wasm';

export interface FeatureWeight {
  feature: string;
  weight: number;
}

export class SimHash {
  private hasher: (input: string, seedHigh?: number, seedLow?: number) => string;

  private constructor(hasher: any) {
    this.hasher = hasher;
  }

  static async create(): Promise<SimHash> {
    const { h64 } = await xxhash();
    return new SimHash(h64);
  }

  /**
   * Compute a 64-bit SimHash signature for a set of weighted features.
   */
  computeSignature(features: FeatureWeight[]): bigint {
    const v = new Array(64).fill(0);

    for (const f of features) {
      const hexHash = this.hasher(f.feature);
      const hashVal = BigInt('0x' + hexHash);

      for (let i = 0; i < 64; i++) {
        const bit = (hashVal >> BigInt(i)) & 1n;
        if (bit === 1n) {
          v[i] += f.weight;
        } else {
          v[i] -= f.weight;
        }
      }
    }

    let signature = 0n;
    for (let i = 0; i < 64; i++) {
      if (v[i] > 0) {
        signature |= (1n << BigInt(i));
      }
    }

    return signature;
  }

  /**
   * Estimate similarity based on Hamming distance between two 64-bit signatures.
   * Returns a value between 0 and 1, representing the percentage of identical bits.
   */
  estimateCosine(sig1: bigint, sig2: bigint): number {
    const xor = sig1 ^ sig2;
    
    // Count set bits (hamming distance) using Brian Kernighan's algorithm
    let hammingDist = 0n;
    let temp = xor;
    while (temp > 0n) {
      temp &= temp - 1n;
      hammingDist++;
    }
    
    const identicalBits = 64 - Number(hammingDist);
    return identicalBits / 64;
  }
}
