import { z } from 'zod';
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

export const resolveSchema = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  perceptualHash: z.string().regex(/^[0-9a-f]{16}$/).optional(),
  mediaType: z.enum(['VIDEO', 'IMAGE', 'AUDIO', 'PDF', 'OTHER']),
}).refine(d => d.hash || d.perceptualHash, { message: 'hash or perceptualHash required' });

export type ResolveDto = z.infer<typeof resolveSchema>;

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parsed.error.format(),
      });
    }
    return parsed.data;
  }
}
