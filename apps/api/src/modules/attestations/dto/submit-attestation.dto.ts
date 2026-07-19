import { z } from 'zod';
import { PipeTransform, Injectable } from '@nestjs/common';
import { attestationPayloadSchema } from '@antiai/attestation-core';
import { AttestationError } from '../errors/attestation-errors';

export const submitAttestationSchema = z.object({
  payload: attestationPayloadSchema,
  payloadHash: z.string().regex(/^[0-9a-f]{64}$/),
  signature: z.string().base64().length(88), // 64-byte Ed25519 sig, base64
}).strict();

export type SubmitAttestationDto = z.infer<typeof submitAttestationSchema>;

// Phase 1 gate: only public claim types accepted on this route.
export const PUBLIC_CLAIM_TYPES = new Set([
  'provenance_found', 'artifact_flag', 'context_note', 'corroboration',
]);

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AttestationError('SCHEMA_INVALID', 400, {
        issues: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    return result.data;
  }
}
