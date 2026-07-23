import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { LedgerService } from '../src/modules/reputation/ledger.service';
import { randomUUID } from 'crypto';
import { ReputationEventType } from '@prisma/client';

describe('LedgerService', () => {
  let prisma: PrismaService;
  let ledger: LedgerService;

  beforeAll(async () => {
    // Set required environment variables for Nest setup if any are missing
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'mock-client-id';
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    ledger = app.get(LedgerService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Property Test 1: Reputation is strictly bounded [0,1]', async () => {
    // Create a test user
    const user = await prisma.verifierIdentity.create({
      data: {
        id: randomUUID(),
        reputation: 0.10,
        status: 'ACTIVE',
        keyId: `key-${randomUUID()}`,
        publicKey: 'mock-' + randomUUID(),
        platform: 'extension',
      }
    });
    
    const eventsToApply = [
      { type: 'SETTLEMENT_CORRECT' as ReputationEventType, delta: 0.5 },
      { type: 'SETTLEMENT_CORRECT' as ReputationEventType, delta: 0.6 },
      { type: 'SETTLEMENT_INCORRECT' as ReputationEventType, delta: -2.0 },
      { type: 'CANARY_PASS' as ReputationEventType, delta: 0.3 },
    ];

    for (const e of eventsToApply) {
      await ledger.apply({
        identityId: user.id,
        type: e.type,
        delta: e.delta,
      });
      
      const updated = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.reputation).toBeGreaterThanOrEqual(0);
      expect(updated.reputation).toBeLessThanOrEqual(1);
    }
  });

  it('Property Test 2: (Skipped) Vouch graph cycle handled safely.', () => {
    // NOTE: Vouch logic is pending Phase 3/4 integration
  });

  it('Replay Determinism Test: Identities match their replayed event stream', async () => {
    // Seed 5 mock users
    const userIds = [];
    for (let i = 0; i < 5; i++) {
      const u = await prisma.verifierIdentity.create({
        data: {
          id: randomUUID(),
          reputation: 0.10, // Initial R0
          status: 'ACTIVE',
          keyId: `key-${randomUUID()}`,
          publicKey: 'mock-' + randomUUID(),
          platform: 'extension',
        }
      });
      userIds.push(u.id);
    }

    // Generate random events for them
    for (const uid of userIds) {
      const history = [];
      for (let j = 0; j < 20; j++) {
        const d = (Math.random() - 0.5) * 0.1;
        history.push({ delta: d, type: 'SETTLEMENT_CORRECT' as ReputationEventType });
      }
      for (const h of history) {
        await ledger.apply({ identityId: uid, type: h.type, delta: h.delta });
      }
    }

    // Verify EVERY seeded identity in the database
    const allIdentities = await prisma.verifierIdentity.findMany({
      where: {
        id: { in: userIds }
      }
    });

    for (const identity of allIdentities) {
      const events = await prisma.reputationEvent.findMany({
        where: { identityId: identity.id },
        orderBy: { createdAt: 'asc' }
      });

      if (events.length === 0) continue; // Skip identities without events

      let replayedR = 0.10;
      for (const ev of events) {
        replayedR = Math.min(1, Math.max(0, replayedR + ev.delta));
      }

      // Allow a tiny float tolerance
      expect(Math.abs(replayedR - identity.reputation)).toBeLessThanOrEqual(0.0001);
    }
  }, 30000);
});
