import { z } from 'zod';

export const attestationPayloadSchema = z.object({
  version: z.string(),
  subject: z.object({
    hash: z.string(),
    perceptualHash: z.string().optional(),
    mediaType: z.enum(['video', 'image', 'audio', 'pdf', 'other']),
    sizeBytes: z.number().optional()
  }),
  claim: z.object({
    type: z.enum([
      'provenance_found', 'artifact_flag', 'context_note', 'corroboration',
      'custody_received', 'custody_transferred', 'custody_sealed', 'integrity_verified', 'redaction_applied'
    ]),
    payload: z.record(z.string(), z.unknown())
  }).superRefine((val, ctx) => {
    if (val.type === 'provenance_found') {
      if (!val.payload || typeof val.payload.sourceUrl !== 'string') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'provenance_found requires a sourceUrl string',
          path: ['payload', 'sourceUrl'],
        });
      } else {
        try {
          new URL(val.payload.sourceUrl);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'sourceUrl must be a valid URL',
            path: ['payload', 'sourceUrl'],
          });
        }
      }
    }
  }),
  attester: z.object({
    keyId: z.string(),
    identityClass: z.enum(['pseudonymous', 'verified_person', 'organizational_role'])
  }),
  context: z.object({
    domain: z.string(), // e.g. "public" or "circle:<id>"
    priorAttestation: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
    nonce: z.string()
  })
}).strict();
