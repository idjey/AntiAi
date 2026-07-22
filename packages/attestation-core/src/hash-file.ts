import { Hash } from 'fast-sha256';
import { bytesToHex } from './crypto';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

export async function hashFile(
  file: File | Blob,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const h = new Hash();
  let offset = 0;
  
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const slice = file.slice(offset, end);
    
    // Explicitly scope the buffer logic so it can be aggressively garbage collected
    const processChunk = async () => {
      const buffer = await slice.arrayBuffer();
      h.update(new Uint8Array(buffer));
    };
    await processChunk();
    
    offset += CHUNK_SIZE;
    if (onProgress) {
      onProgress(Math.min(offset / file.size, 1));
    }
  }
  
  return bytesToHex(h.digest());
}
