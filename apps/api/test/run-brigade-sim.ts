import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AggregationProcessor } from '../src/modules/aggregation/aggregation.processor';
import { ClusteringWorker } from '../src/modules/canaries/clustering.worker';
import { WeightsService } from '../src/modules/aggregation/weights.service';
import { randomUUID } from 'crypto';
async function run() {
  console.log('--- Setting up Multi-Cohort Brigade Simulation ---');
  process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Enable trust proxy so X-Forwarded-For is respected by ThrottlerGuard
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  
  await app.init();

  const prisma = app.get(PrismaService);
  const processor = app.get(AggregationProcessor);
  const clusteringWorker = app.get(ClusteringWorker);
  const weightsService = app.get(WeightsService);

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
          initialReputation: 0.10,
          flags: { shadowMode: true, liveWeighting: false, liveSlashing: false },
          earn: { vouch: 2, claimCorrect: 1 },
          slash: { vouch: 10, claimIncorrect: 5 },
          math: { sybilCompressionExp: 2.0 }, 
          platformFactor: { deviceAttested: 1.0, web: 0.6 }, 
          canary: { downweightAccuracy: 0.55, suspendAccuracy: 0.35, downweightFactor: 0.5 }, 
          weightExponent: 1.5, 
          correlation: { clusterExponent: 0.5, clusterOutlierFactor: 1.5, clusterShareExponent: 2.0 },
        },
        comment: 'Brigade simulation config',
        activationRequestedBy: 'sim',
        approvedBy: 'admin',
        active: false,
      }
    });

    await app.get(require('../src/modules/reputation/config.service').ConfigService).activateConfig(config.id, 'admin2');

    const identityService = app.get(require('../src/modules/identity/identity.service').IdentityService);

    const request = require('supertest');
    // Helper to create users via HTTP front-door
    let userCounter = 0;
    const createCohort = async (size: number, rep: number, label: string, deviceAttested: boolean = false) => {
      const ids = [];
      const keys = []; // keep track of keys to sign attestations
      for (let i=0; i<size; i++) {
        userCounter++;
        const fakeIp = `1.1.1.${userCounter}`;
        const keyPair = require('tweetnacl').sign.keyPair();
        const publicKeyB64 = Buffer.from(keyPair.publicKey).toString('base64');
        
        const challengeRes = await request(app.getHttpServer())
          .post('/v1/identities/challenge')
          .set('X-Forwarded-For', fakeIp)
          .send({ publicKey: publicKeyB64 });
        
        const nonceBytes = Buffer.from(challengeRes.body.nonce, 'utf8');
        const signature = require('tweetnacl').sign.detached(nonceBytes, keyPair.secretKey);
        const challengeSignature = Buffer.from(signature).toString('base64');
        
        const regRes = await request(app.getHttpServer())
          .post('/v1/identities/register')
          .set('X-Forwarded-For', fakeIp)
          .send({
            publicKey: publicKeyB64,
            challengeSignature,
            platform: 'EXTENSION',
            deviceAttestationToken: deviceAttested ? 'mock-token' : undefined
          });

        const keyId = regRes.body.keyId;

        // Fast-forward reputation for test using DB directly
        const u = await prisma.verifierIdentity.update({
          where: { keyId: keyId },
          data: { reputation: rep, status: 'ACTIVE' }
        });
        
        ids.push(u.id);
        keys.push({ id: u.id, keyId, keyPair });
      }
      return keys;
    };

    // Honest Cohort (3 users)
    const honestKeys = await createCohort(3, 0.95, 'honest', true);
    
    // Naive Cohort (20 users)
    const naiveKeys = await createCohort(20, 0.10, 'naive');

    // Patient Cohort (20 users, registered a week ago)
    const patientKeys = await createCohort(20, 0.10, 'patient');
    await prisma.verifierIdentity.updateMany({
      where: { id: { in: patientKeys.map(k => k.id) } },
      data: { createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Careful Cohort (20 users, temporally spread)
    const carefulKeys = await createCohort(20, 0.10, 'careful');
    const evasionKeys = await createCohort(20, 0.10, 'evasion'); // 2 subject botnet
    const midRepKeys = await createCohort(1, 0.40, 'midrep');
    
    // Create Subject
    const subjectHashes = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    const subjectHash = subjectHashes[0]; // The main one we aggregate for
    
    // Helper to submit attestation via HTTP
    const { signAttestation } = require('@antiai/attestation-core');
    const submitAtt = async (keyInfo: any, sourceUrl: string, clientTime: Date, targetHash: string = subjectHash) => {
      const payload: any = {
        version: '1.0',
        subject: {
          hash: targetHash,
          perceptualHash: 'aaaaaaaaaaaaaaaa',
          mediaType: 'image',
          sizeBytes: 1024,
        },
        claim: {
          type: 'provenance_found',
          payload: { sourceUrl }
        },
        attester: {
          keyId: keyInfo.keyId,
          identityClass: 'pseudonymous'
        },
        context: {
          domain: 'public',
          timestamp: clientTime.toISOString(),
          nonce: randomUUID()
        }
      };

      const signed = signAttestation(payload, keyInfo.keyPair.secretKey);

      // Mock Date.now so the server thinks clientTime is 'now' to pass skew check
      const OriginalDateNow = Date.now;
      global.Date.now = () => clientTime.getTime();
      
      try {
        const res = await request(app.getHttpServer())
          .post('/v1/attestations')
          .set('X-Forwarded-For', keyInfo.keyId)
          .send({
            payload: signed.payload,
            payloadHash: signed.payloadHash,
            signature: signed.signature
          });
        if (res.status >= 400) {
          console.error(`Attestation rejected: ${res.status} ${JSON.stringify(res.body)}`);
        }
      } finally {
        global.Date.now = OriginalDateNow;
      }
    };

    // --- Drive actual attestation behavior ---
    
    // The whole sim happens on 2026-07-19 so the worker sees them all
    const simBase = new Date('2026-07-19T10:00:00Z');

    // Helper to submit to subjects
    const submitToSubjects = async (keyInfo: any, sourceUrl: string, baseTime: Date, numSubjects: number, timeSpacingMs: number = 0) => {
      for(let s=0; s<numSubjects; s++) {
        const time = new Date(baseTime.getTime() + s * timeSpacingMs);
        const savedHash = subjectHash; // save global
        // override global subjectHash for submitAtt helper
        (global as any).testSubjectHash = subjectHashes[s];
        await submitAtt(keyInfo, sourceUrl, time, (global as any).testSubjectHash);
      }
    };

    // Naive Cohort (20 users, 5 subjects, same timestamp for each subject)
    for (const key of naiveKeys) {
      await submitToSubjects(key, 'https://fake-naive', simBase, 5);
    }

    // Patient Cohort (20 users, 5 subjects, same timestamp)
    for (const key of patientKeys) {
      await submitToSubjects(key, 'https://fake-patient', simBase, 5);
    }

    // Careful Cohort (20 users, 5 subjects, temporally spread over 5 hours per subject)
    for (let i = 0; i < carefulKeys.length; i++) {
      const time = new Date(simBase.getTime() + i * 15 * 60 * 1000); // 15 mins apart
      await submitToSubjects(carefulKeys[i], 'https://fake-careful', time, 5);
    }

    // MidRep Attacker (Case 6) (1 user, 5 subjects, identical to Naive)
    for (const key of midRepKeys) {
      await submitToSubjects(key, 'https://fake-midrep', simBase, 5);
    }

    // Evasion Botnet (20 users, only 2 subjects, identical timestamp)
    for (const key of evasionKeys) {
      await submitToSubjects(key, 'https://fake-evasion', simBase, 2);
    }

    // Honest Cohort (3 users, 5 subjects total)
    // 1st subject: Collides exactly with Naive at simBase (1 shared bucket)
    // 2nd-5th subjects: Completely random timestamp 12 hours later (no shared bucket with botnet)
    for (let i = 0; i < honestKeys.length; i++) {
      // Subject 1: Collide
      await submitAtt(honestKeys[i], 'https://real', simBase, subjectHashes[0]);
      
      // Subject 2-5: No collision
      for (let s=1; s<5; s++) {
        const diffTime = new Date(simBase.getTime() + (i * 100 + s * 10) * 60 * 60 * 1000); // completely different time buckets
        await submitAtt(honestKeys[i], 'https://real', diffTime, subjectHashes[s]);
      }
    }

    
    // --- Manually verify and print Honest vs Botnet Jaccard Similarity ---
    const minhash = await require('../src/modules/clustering/minhash').MinHash.create(128);
    const honestAtts = await prisma.attestation.findMany({ where: { attesterId: honestKeys[0].id } });
    const naiveAtts = await prisma.attestation.findMany({ where: { attesterId: naiveKeys[0].id } });
    
    const getBuckets = (atts: any[]) => atts.map(a => `${a.subjectId}:${Math.floor(a.receivedAt.getTime() / (10 * 60 * 1000))}`);
    const honestSig = minhash.computeSignature(getBuckets(honestAtts));
    const naiveSig = minhash.computeSignature(getBuckets(naiveAtts));
    
    const jaccardScore = minhash.estimateJaccard(honestSig, naiveSig);
    console.log(`\n[Jaccard Verification] Honest[0] vs Naive[0]: ${jaccardScore.toFixed(3)}\n`);
// --- Run Clustering Worker ---
    // Mock Date.now to be just after the last attestation so all fall in the last 24h
    const originalNow = global.Date.now;
    global.Date.now = () => simBase.getTime() + 10 * 60 * 60 * 1000; // 10 hours later
    try {
      await clusteringWorker.process({} as any);
    } finally {
      global.Date.now = originalNow;
    }

    const clusters = await prisma.correlationCluster.findMany();
    console.log('\n--- Correlation Clusters Produced ---');
    console.log(JSON.stringify(clusters, null, 2));

    // Determine which cohorts got caught by intersecting memberIds
    for (const cluster of clusters) {
      const members = cluster.memberIds;
      if (members.includes(naiveKeys[0].id)) console.log(`=> This cluster caught the NAIVE cohort.`);
      if (members.includes(patientKeys[0].id)) console.log(`=> This cluster caught the PATIENT cohort.`);
      if (members.includes(carefulKeys[0].id)) console.log(`=> This cluster caught the CAREFUL cohort.`);
      if (members.includes(evasionKeys[0].id)) console.log(`=> This cluster caught the EVASION cohort.`);
      if (members.includes(midRepKeys[0].id)) console.log(`=> This cluster caught the MIDREP cohort.`);
    }

    const carefulCaught = clusters.some(c => c.memberIds.includes(carefulKeys[0].id));
    if (!carefulCaught) {
      console.log(`\nNOTE: The CAREFUL cohort evaded detection because they only matched on SimHash (1 signal), and >= 2 signals are required!`);
    }

    // --- Output the actual effective weights by calling WeightsService directly ---
    console.log('\n--- Effective Weight Margins ---');
    
    // Get subject by hash since HTTP endpoint created it
    const subject = await prisma.subject.findUnique({
      where: { hash: subjectHash }
    });
    
    const allAtts = await prisma.attestation.findMany({
      where: { subjectId: subject!.id },
      include: { attester: true }
    });
    
    // Pass them to WeightsService
    const weightsMap = await weightsService.for(allAtts);
    
    let honestWeight = 0;
    let naiveWeight = 0;
    let patientWeight = 0;
    let carefulWeight = 0;
    let evasionWeight = 0;
    let midRepWeight = 0;

    for (const att of allAtts) {
      const w = weightsMap.get(att.id) || 0;
      if (honestKeys.map(k=>k.id).includes(att.attesterId)) honestWeight += w;
      if (naiveKeys.map(k=>k.id).includes(att.attesterId)) naiveWeight += w;
      if (patientKeys.map(k=>k.id).includes(att.attesterId)) patientWeight += w;
      if (carefulKeys.map(k=>k.id).includes(att.attesterId)) carefulWeight += w;
      if (evasionKeys.map(k=>k.id).includes(att.attesterId)) evasionWeight += w;
      if (midRepKeys.map(k=>k.id).includes(att.attesterId)) midRepWeight += w;
    }

    console.log(`Total Honest Weight: ${honestWeight.toFixed(4)} (3 users at R=0.95, deviceAttested=true)`);
    console.log(`Per-User Honest Weight: ${(weightsMap.get(allAtts.find(a => honestKeys.map(k=>k.id).includes(a.attesterId))?.id || '') || 0).toFixed(4)}`);
    console.log(`Total Naive Attack Weight: ${naiveWeight.toFixed(4)} (20 users at R=0.10, post-compression)`);
    console.log(`Total Patient Attack Weight: ${patientWeight.toFixed(4)} (20 users at R=0.10, post-compression)`);
    console.log(`Total Careful Attack Weight: ${carefulWeight.toFixed(4)} (20 users at R=0.10, evading compression!)`);
    console.log(`Per-User Careful Weight: ${(weightsMap.get(allAtts.find(a => carefulKeys.map(k=>k.id).includes(a.attesterId))?.id || '') || 0).toFixed(4)}`);
    console.log(`Total Evasion Attack Weight: ${evasionWeight.toFixed(4)} (20 users at R=0.10, 2 subjects)`);
    console.log(`Mid-Rep Attacker (Case 6) Weight: ${midRepWeight.toFixed(4)} (1 user at R=0.40, clustered with Naive)`);
    
    // --- Run Shadow Engine Aggregation ---
    console.log(`\n--- Running shadow aggregation for subject ${subjectHash} ---`);
    await processor.process({ data: { subjectHash: subjectHash } } as any);

    // Verify Results
    const diff = await prisma.shadowVerdictDiff.findFirst({
      where: { subjectId: subject!.id },
      orderBy: { computedAt: 'desc' }
    });

    console.log('\n--- Shadow Verdict Diff ---');
    console.log(JSON.stringify(diff, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await app.close();
  }
}

run();
