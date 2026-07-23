import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { ProvenanceProcessor, DNS_LOOKUP } from '../src/provenance.processor';
import { getQueueToken } from '@nestjs/bullmq';
import * as http from 'http';
import { randomUUID } from 'crypto';
import { PhashService } from '../src/phash.service';
import { Job } from 'bullmq';
import { lookup } from 'node:dns/promises';

import * as https from 'https';
const mkcert = require('mkcert');

jest.mock('ipaddr.js', () => {
  const original = jest.requireActual('ipaddr.js');
  return {
    ...original,
    parse: (address: string) => {
      const ip = original.parse(address);
      if (address === '127.0.0.1') {
        ip.range = () => 'unicast';
      }
      return ip;
    }
  };
});

jest.mock('undici', () => {
  const actual = jest.requireActual('undici');
  return {
    ...actual,
    Agent: class MockAgent extends actual.Agent {
      constructor(opts: any) {
        if (opts && opts.connect) {
          opts.connect.ca = (global as any).TEST_CA_CERT;
        }
        super(opts);
      }
    }
  };
});

describe('ProvenanceWorker (e2e)', () => {
  let app: any;
  let prisma: PrismaService;
  let processor: ProvenanceProcessor;
  let server: any;
  let serverPort: number;

  const mockAggregationQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
  };

  beforeAll(async () => {
    // 1. Setup Fixture Server on port 443 with HTTPS and trusted CA
    const ca = await mkcert.createCA({
      organization: 'Test CA',
      countryCode: 'US',
      state: 'CA',
      locality: 'SF',
      validity: 365
    });

    const cert = await mkcert.createCert({
      ca: { key: ca.key, cert: ca.cert },
      domains: ['127.0.0.1', 'youtube.com'],
      validity: 365
    });

    // Make the CA cert available to the undici mock
    (global as any).TEST_CA_CERT = ca.cert;

    const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64');
    server = https.createServer({ key: cert.key, cert: cert.cert }, (req, res) => {
      res.writeHead(200, { 'Content-Type': 'image/gif' });
      res.end(gifBytes);
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(443, '127.0.0.1', () => {
        serverPort = 443;
        resolve();
      });
      server.on('error', reject);
    });

    // 2. Setup the NestJS environment with real DB, real hashing, BUT injectable DNS
    const mockAggregationQueue = {
      add: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(getQueueToken('aggregation'))
    .useValue(mockAggregationQueue)
    .overrideProvider(DNS_LOOKUP)
    .useValue(async (hostname: string, options: any) => {
      if (hostname === 'youtube.com') {
        return [{ address: '127.0.0.1', family: 4 }];
      }
      return lookup(hostname, options);
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get(PrismaService);
    processor = app.get(ProvenanceProcessor);
  }, 30000);

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('1. Golden Path: Worker successfully verifies a known URL and flips to MACHINE_VERIFIED', async () => {
    // Generate actual pHash for the 1x1 black GIF
    const phashService = app.get(PhashService);
    const gifBytes = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64');
    const pHash = await phashService.compute(gifBytes, 'IMAGE');

    // Seed dummy subject with the EXACT pHash
    const subject = await prisma.subject.create({
      data: {
        hash: 'sha256-mock-' + randomUUID(),
        mediaType: 'IMAGE',
        perceptualHash: pHash,
      }
    });

    const user = await prisma.verifierIdentity.create({
      data: {
        id: randomUUID(),
        reputation: 0.5,
        status: 'ACTIVE',
        keyId: 'mock-' + randomUUID(),
        publicKey: 'mock-' + randomUUID(),
        platform: 'extension',
      }
    });

    const attestation = await prisma.attestation.create({
      data: {
        id: randomUUID(),
        subject: { connect: { id: subject.id } },
        attester: { connect: { id: user.id } },
        claimType: 'PROVENANCE_FOUND',
        claimPayload: { sourceUrl: `https://youtube.com/test-video` },
        payloadHash: 'hash-' + randomUUID(),
        signature: 'mock-sig',
        status: 'PENDING',
        version: '1',
        clientTimestamp: new Date(),
        nonce: randomUUID(),
      }
    });

    // Run the processor synchronously as a BullMQ job
    await processor.process({ data: { attestationId: attestation.id } } as Job);

    // Assert it flipped to MACHINE_VERIFIED in the real DB
    const updated = await prisma.attestation.findUnique({ where: { id: attestation.id } });
    expect(updated?.status).toBe('MACHINE_VERIFIED');
    expect((updated?.claimPayload as any).matchScore).toBeDefined();
  });

  it('2. SSRF Guard Companion Case: A disallowed target is rejected without throwing (no retry)', async () => {
    const subject = await prisma.subject.create({
      data: {
        hash: 'sha256-mock-' + randomUUID(),
        mediaType: 'IMAGE',
        perceptualHash: 'any-hash',
      }
    });

    const user = await prisma.verifierIdentity.create({
      data: {
        id: randomUUID(),
        reputation: 0.5,
        status: 'ACTIVE',
        keyId: 'mock-' + randomUUID(),
        publicKey: 'mock-' + randomUUID(),
        platform: 'extension',
      }
    });

    const attestation = await prisma.attestation.create({
      data: {
        id: randomUUID(),
        subject: { connect: { id: subject.id } },
        attester: { connect: { id: user.id } },
        claimType: 'PROVENANCE_FOUND',
        claimPayload: { sourceUrl: `https://example.com/some-url` }, // example.com is NOT in ALLOWED_HOSTS
        payloadHash: 'hash-' + randomUUID(),
        signature: 'mock-sig',
        status: 'PENDING',
        version: '1',
        clientTimestamp: new Date(),
        nonce: randomUUID(),
      }
    });

    // Run the processor. We expect it to NOT throw an error (which tells BullMQ not to retry).
    await expect(
      processor.process({ data: { attestationId: attestation.id } } as Job)
    ).resolves.not.toThrow();

    // The status should remain PENDING because it failed the guard.
    const updated = await prisma.attestation.findUnique({ where: { id: attestation.id } });
    expect(updated?.status).toBe('PENDING');
    expect((updated?.claimPayload as any).matchScore).toBeUndefined();
  });
});
