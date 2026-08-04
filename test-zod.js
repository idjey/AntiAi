const { z } = require('zod');

const resolveSchema = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  perceptualHashes: z.array(z.object({
    fraction: z.number(),
    hash: z.string().regex(/^[0-9a-f]{16}$/)
  })).optional(),
  mediaType: z.enum(['VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'OTHER']),
}).refine(d => d.hash || (d.perceptualHashes && d.perceptualHashes.length > 0), { message: 'hash or perceptualHashes required' });

const payload = {
  hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', // 64 chars
  perceptualHashes: [{ fraction: 1.0, hash: 'ffffffffffffffff' }], // 16 chars
  mediaType: 'IMAGE'
};

const result = resolveSchema.safeParse(payload);
if (!result.success) {
  console.log("Failed:", result.error.format());
} else {
  console.log("Success:", result.data);
}
