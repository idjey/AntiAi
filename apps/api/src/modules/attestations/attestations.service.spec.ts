import { Test, TestingModule } from '@nestjs/testing';
import { AttestationsService } from './attestations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvelopeVerifierService } from './services/envelope-verifier.service';
import { IdentityCacheService } from './services/identity-cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { IdempotencyService } from './services/idempotency.service';
import { getQueueToken } from '@nestjs/bullmq';
import { AttestationError } from './errors/attestation-errors';
import { CanariesService } from '../canaries/canaries.service';

describe('AttestationsService', () => {
  let service: AttestationsService;
  let mockPrisma: any;
  let mockVerifier: any;
  let mockIdentityCache: any;
  let mockRateLimit: any;
  let mockIdempotency: any;
  let mockCanaries: any;
  let mockAggQ: any;
  let mockProvQ: any;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      attestation: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      subject: {
        upsert: jest.fn(),
      }
    };

    mockVerifier = {
      assertCanonicalHash: jest.fn().mockReturnValue(Buffer.from('hash')),
      assertSignature: jest.fn(),
    };

    mockIdentityCache = {
      resolve: jest.fn(),
      assertUsable: jest.fn(),
    };

    mockRateLimit = {
      consume: jest.fn(),
    };

    mockAggQ = { add: jest.fn() };
    mockProvQ = { add: jest.fn() };

    mockIdempotency = {
      check: jest.fn(),
      record: jest.fn(),
    };

    mockCanaries = {
      processCanaryIfMatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttestationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EnvelopeVerifierService, useValue: mockVerifier },
        { provide: IdentityCacheService, useValue: mockIdentityCache },
        { provide: RateLimitService, useValue: mockRateLimit },
        { provide: IdempotencyService, useValue: mockIdempotency },
        { provide: CanariesService, useValue: mockCanaries },
        { provide: getQueueToken('aggregation'), useValue: mockAggQ },
        { provide: getQueueToken('provenance-verify'), useValue: mockProvQ },
      ],
    }).compile();

    service = module.get<AttestationsService>(AttestationsService);
  });

  const validPayload = {
    version: '1.0',
    subject: { hash: 'hash1', perceptualHash: 'phash', mediaType: 'image', sizeBytes: 100 },
    claim: { type: 'provenance_found', payload: { sourceUrl: 'http://test' } },
    attester: { keyId: 'key123', identityClass: 'pseudonymous' },
    context: { timestamp: new Date().toISOString(), domain: 'public', nonce: 'n1' }
  };
  const validDto = {
    payload: validPayload as any,
    payloadHash: 'hash',
    signature: 'sig'
  };

  it('rejects unregistered identities', async () => {
    mockIdentityCache.resolve.mockRejectedValue(new AttestationError('UNKNOWN_KEY', 403));
    await expect(service.submit(validDto as any))
      .rejects.toThrow(new AttestationError('UNKNOWN_KEY', 403));
  });

  it('rejects duplicate envelopes using idempotency check', async () => {
    mockIdentityCache.resolve.mockResolvedValue({ id: 'id1', publicKey: 'pk', status: 'PROBATION' });
    mockIdempotency.check.mockResolvedValue('existing');

    const res = await service.submit(validDto as any);
    expect(res.duplicate).toBe(true);
    expect(res.id).toBe('existing');
  });

  it('enqueues provenance job for provenance_found claim', async () => {
    mockIdentityCache.resolve.mockResolvedValue({ id: 'id1', publicKey: 'pk', status: 'PROBATION' });
    mockIdempotency.check.mockResolvedValue(null);
    mockPrisma.subject.upsert.mockResolvedValue({ hash: 'hash1' });
    mockPrisma.attestation.create.mockResolvedValue({ id: 'new-att-id', claimType: 'PROVENANCE_FOUND' });

    const res = await service.submit(validDto as any);
    
    expect(res.duplicate).toBe(false);
    expect(res.id).toBe('new-att-id');
    expect(mockAggQ.add).toHaveBeenCalledWith('recompute', { subjectHash: 'hash1' }, expect.any(Object));
    expect(mockProvQ.add).toHaveBeenCalledWith('verify', { attestationId: 'new-att-id' }, expect.any(Object));
  });
});
