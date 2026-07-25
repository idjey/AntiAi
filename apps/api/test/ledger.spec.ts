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

  it('Property Test 2: Vouch propagation fires within age window with correct beta', async () => {
    const voucher = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    const vouchee = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    
    // Vouch created today
    await prisma.vouch.create({
      data: { voucherId: voucher.id, voucheeId: vouchee.id, stakeAmount: 100, signature: 'mock-sig' }
    });

    // Slash the vouchee
    await ledger.apply({ identityId: vouchee.id, type: 'SETTLEMENT_INCORRECT', delta: -0.40 });

    const updatedVouchee = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: vouchee.id } });
    const updatedVoucher = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: voucher.id } });

    // Vouchee was slashed directly by 0.40
    expect(updatedVouchee.reputation).toBeCloseTo(0.10);
    
    // Voucher gets 0.25 (beta) * -0.40 = -0.10
    expect(updatedVoucher.reputation).toBeCloseTo(0.40);
  });

  it('Property Test 3: Expired vouch window causes no propagation', async () => {
    const voucher = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    const vouchee = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    
    // Vouch created 100 days ago (past the 90 day default window)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    await prisma.vouch.create({
      data: { voucherId: voucher.id, voucheeId: vouchee.id, stakeAmount: 100, signature: 'mock-sig', createdAt: oldDate }
    });

    // Slash the vouchee
    await ledger.apply({ identityId: vouchee.id, type: 'SETTLEMENT_INCORRECT', delta: -0.40 });

    const updatedVoucher = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: voucher.id } });

    // Voucher should be completely unaffected
    expect(updatedVoucher.reputation).toBeCloseTo(0.50);
  });

  it('Property Test 4: Vouch graph cycle (A->B->A) halts safely at depth 1', async () => {
    const userA = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    const userB = await prisma.verifierIdentity.create({
      data: { id: randomUUID(), reputation: 0.50, status: 'ACTIVE', keyId: `k-${randomUUID()}`, publicKey: `pk-${randomUUID()}`, platform: 'web' }
    });
    
    // Create cyclic vouch: A vouches for B, B vouches for A
    await prisma.vouch.create({
      data: { voucherId: userA.id, voucheeId: userB.id, stakeAmount: 100, signature: 'mock-sig' }
    });
    await prisma.vouch.create({
      data: { voucherId: userB.id, voucheeId: userA.id, stakeAmount: 100, signature: 'mock-sig' }
    });

    // Slash user A
    await ledger.apply({ identityId: userA.id, type: 'SETTLEMENT_INCORRECT', delta: -0.40 });

    // Propagation: User A slashed -> B is voucher for A -> B gets VOUCH_SLASH_PROPAGATION. 
    // Since B gets VOUCH_SLASH_PROPAGATION, it should NOT propagate back to A.
    
    // Let's count the number of VOUCH_SLASH_PROPAGATION events across the entire DB
    const propEvents = await prisma.reputationEvent.findMany({
      where: { type: 'VOUCH_SLASH_PROPAGATION', identityId: { in: [userA.id, userB.id] } }
    });

    // Exactly 1 propagation event should exist (which was applied to B)
    expect(propEvents.length).toBe(1);
    expect(propEvents[0].identityId).toBe(userB.id);

    // Final R checks
    const finalA = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: userA.id } });
    const finalB = await prisma.verifierIdentity.findUniqueOrThrow({ where: { id: userB.id } });

    // A is 0.50 - 0.40 = 0.10. It shouldn't be slashed again from B's propagation.
    expect(finalA.reputation).toBeCloseTo(0.10);
    // B is 0.50 - (0.40 * 0.25) = 0.40.
    expect(finalB.reputation).toBeCloseTo(0.40);
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
  }, 60000);
});
