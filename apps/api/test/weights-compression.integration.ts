import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AggregationProcessor } from '../src/modules/aggregation/aggregation.processor';
import { randomUUID } from 'crypto';
import RedisMock from 'ioredis-mock';

async function run() {
  console.log('--- Setting up Red-Team Brigade Simulation ---');
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
  .overrideProvider('REDIS_INSTANCE')
  .useValue(new RedisMock())
  .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);
  const processor = app.get(AggregationProcessor);

  try {
    // Clean database
    await prisma.reputationEvent.deleteMany({});
    await prisma.shadowVerdictDiff.deleteMany({});
    await prisma.reputationConfig.deleteMany({});
    await prisma.attestation.deleteMany({});
    await prisma.vouch.deleteMany({});
    await prisma.correlationCluster.deleteMany({});
    await prisma.verifierIdentity.deleteMany({});
    await prisma.subject.deleteMany({});
    
    // 1. Create a fake configuration version 10
    const config = await prisma.reputationConfig.create({
      data: {
        params: {
          flags: { shadowMode: true, liveWeighting: false, liveSlashing: false },
          earn: { vouch: 2, claimCorrect: 1 },
          slash: { vouch: 10, claimIncorrect: 5 },
          math: { sybilCompressionExp: 2.0 }, 
          platformFactor: { deviceAttested: 1.0, web: 0.5 }, 
          canary: { downweightFactor: 0.1 }, 
          weightExponent: 1.0, 
          correlation: { clusterExponent: 0.5, clusterOutlierFactor: 3.0, clusterShareExponent: 2.0 },
        },
        comment: 'Brigade simulation config',
        activationRequestedBy: 'sim',
        approvedBy: 'admin',
        active: false,
      }
    });

    await app.get(require('../src/modules/reputation/config.service').ConfigService).activateConfig(config.id, 'admin2');

    // 2. Set up Honest Cohort A (3 users)
    const honestIds = [];
    for (let i=0; i<3; i++) {
      const u = await prisma.verifierIdentity.create({
        data: {
          id: randomUUID(),
          reputation: 50,
          status: 'ACTIVE',
          keyId: `key-${randomUUID()}`,
          publicKey: 'mock-' + randomUUID(),
          platform: 'extension',
        }
      });
      honestIds.push(u.id);
    }

    // 3. Set up Attack Cohort B (50 users) in a vouch ring
    const attackIds = [];
    for (let i=0; i<50; i++) {
      const u = await prisma.verifierIdentity.create({
        data: {
          id: randomUUID(),
          reputation: 10, // low score individually
          status: 'ACTIVE',
          keyId: `key-${randomUUID()}`,
          publicKey: 'mock-' + randomUUID(),
          platform: 'extension',
        }
      });
      attackIds.push(u.id);
    }
    
    // They are grouped together by the ClusteringWorker due to MinHash/SimHash matching
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await prisma.correlationCluster.create({
      data: {
        memberIds: attackIds,
        signals: { reason: 'MinHash co-attestation spike' },
        discountFactor: 0.5,
        expiresAt,
      }
    });

    // 4. Create Subject
    const subject = await prisma.subject.create({
      data: {
        hash: randomUUID(),
        mediaType: 'VIDEO',
        attestationCount: 53,
      }
    });

    // 5. Add attestations
    // Attackers insert first (so they win the baseline tie-breaker by timestamp)
    for (const aid of attackIds) {
      await prisma.attestation.create({
        data: {
          id: randomUUID(),
          payloadHash: randomUUID(),
          version: '1',
          subjectId: subject.id,
          claimType: 'PROVENANCE_FOUND',
          claimPayload: { sourceUrl: 'https://fake' },
          attesterId: aid,
          domain: 'PUBLIC',
          clientTimestamp: new Date(),
          nonce: randomUUID(),
          signature: 'mock',
        }
      });
    }

    // Honest say PROVENANCE_FOUND
    for (const hid of honestIds) {
      await prisma.attestation.create({
        data: {
          id: randomUUID(),
          payloadHash: randomUUID(),
          version: '1',
          subjectId: subject.id,
          claimType: 'PROVENANCE_FOUND',
          claimPayload: { sourceUrl: 'https://real' },
          attesterId: hid,
          domain: 'PUBLIC',
          clientTimestamp: new Date(),
          nonce: randomUUID(),
          signature: 'mock',
        }
      });
    }

    // 6. Run Shadow Engine
    console.log(`Running shadow aggregation for subject ${subject.hash}...`);
    await processor.process({ data: { subjectHash: subject.hash } } as any);

    // 7. Verify Results
    const diff = await prisma.shadowVerdictDiff.findFirst({
      where: { subjectId: subject.id },
      orderBy: { computedAt: 'desc' }
    });

    console.log('--- Shadow Verdict Diff ---');
    console.log(JSON.stringify(diff, null, 2));

    if (diff?.flipped) {
      console.log('✅ BRIGADE ATTACK SUCCESSFULLY FLIPPED BY SHADOW ENGINE!');
    } else {
      console.log('❌ SHADOW ENGINE FAILED TO FLIP VERDICT.');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await app.close();
  }
}

run();
