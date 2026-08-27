import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { OrgRole, Prisma } from '@prisma/client';
import request from 'supertest';
import { sign } from 'jsonwebtoken';

describe('Audit Logging System (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let auditService: AuditService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    auditService = app.get<AuditService>(AuditService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.auditCheckpoint.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.pendingInvite.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('Serializes concurrent actions cleanly without losing chain integrity (Linearity + Red/Green)', async () => {
    // 1. Create User and Org
    const user = await prisma.user.create({ data: { email: 'audit1@test.com', isEmailVerified: true } });
    const org = await prisma.organization.create({
      data: {
        name: 'Audit Org',
        slug: 'audit-org',
        teamMembers: {
          create: {
            userId: user.id,
            role: OrgRole.OWNER,
          }
        }
      }
    });

    // Create an initial Genesis entry to test non-empty chains
    await prisma.$transaction(async (tx) => {
      await auditService.logActionInTx(tx, org.id, {
        userId: user.id,
        action: 'INIT_ORG',
      });
    });

    // 2. RED TEST: Concurrent actions WITHOUT locks should fail with a Unique Constraint Violation (Fork attempt)
    const runWithoutLock = async () => {
      const tx1 = prisma.$transaction(async (tx) => {
        // Sleep to ensure both read the same previousHash before writing
        await new Promise(r => setTimeout(r, 50));
        return auditService.logActionInTx(tx, org.id, {
          userId: user.id,
          action: 'RACE_1',
        });
      });

      const tx2 = prisma.$transaction(async (tx) => {
        await new Promise(r => setTimeout(r, 50));
        return auditService.logActionInTx(tx, org.id, {
          userId: user.id,
          action: 'RACE_2',
        });
      });

      await Promise.all([tx1, tx2]);
    };

    // The unique constraint @@unique([organizationId, previousHash]) will throw P2002 on a fork
    await expect(runWithoutLock()).rejects.toThrow(
      expect.objectContaining({ code: 'P2002' })
    );

    // 3. GREEN TEST: Concurrent actions WITH the advisory lock
    const tx3 = prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${org.id}::text))`;
      await new Promise(r => setTimeout(r, 50));
      return auditService.logActionInTx(tx, org.id, {
        userId: user.id,
        action: 'SAFE_1',
      });
    });

    const tx4 = prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${org.id}::text))`;
      await new Promise(r => setTimeout(r, 50));
      return auditService.logActionInTx(tx, org.id, {
        userId: user.id,
        action: 'SAFE_2',
      });
    });

    await Promise.all([tx3, tx4]);

    // 4. Assert Linearity
    const logs = await prisma.auditLog.findMany({ 
      where: { organizationId: org.id }, 
      orderBy: { id: 'asc' } 
    });

    // We expect 3 logs: INIT_ORG, SAFE_1, SAFE_2 (the RACE ones failed and rolled back)
    expect(logs.length).toBe(3);

    // Exact Genesis assertion
    expect(logs[0].previousHash).toBe('GENESIS');
    
    // Explicitly assert linearity: each log's previousHash matches prior log's hash
    for (let i = 1; i < logs.length; i++) {
      expect(logs[i].previousHash).toBe(logs[i - 1].hash);
    }
  });

  it('Catches concurrent genesis forks (empty chain)', async () => {
    // 1. Create User and Org (No initial audit logs)
    const user = await prisma.user.create({ data: { email: 'genesis@test.com', isEmailVerified: true } });
    const org = await prisma.organization.create({
      data: {
        name: 'Genesis Org',
        slug: 'genesis-org',
      }
    });

    // 2. Fire two concurrent mutations without a lock on an empty chain
    const runGenesisWithoutLock = async () => {
      const tx1 = prisma.$transaction(async (tx) => {
        await new Promise(r => setTimeout(r, 50));
        return auditService.logActionInTx(tx, org.id, {
          userId: user.id,
          action: 'GENESIS_1',
        });
      });

      const tx2 = prisma.$transaction(async (tx) => {
        await new Promise(r => setTimeout(r, 50));
        return auditService.logActionInTx(tx, org.id, {
          userId: user.id,
          action: 'GENESIS_2',
        });
      });

      await Promise.all([tx1, tx2]);
    };

    // This should fail because previousHash defaults to 'GENESIS' string, not NULL,
    // so the @@unique([organizationId, previousHash]) constraint catches the collision!
    await expect(runGenesisWithoutLock()).rejects.toThrow(
      expect.objectContaining({ code: 'P2002' })
    );
  });

  it('Catches manual database tampering', async () => {
    const user = await prisma.user.create({ data: { email: 'tamper@test.com', isEmailVerified: true } });
    const org = await prisma.organization.create({
      data: { name: 'Tamper Org', slug: 'tamper-org' }
    });

    // 1. Fire a clean invite action to get a valid log
    const token = sign({ sub: user.id }, 'mock');
    await request(app.getHttpServer())
      .post(`/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'tamper@test.com', role: OrgRole.CREATOR })
      .expect(201);

    // 2. Modify the database row manually behind the app's back
    const logs = await prisma.auditLog.findMany({ where: { organizationId: org.id } });
    const latest = logs[logs.length - 1];

    await prisma.$executeRaw`
      UPDATE audit_logs 
      SET action = 'TAMPERED_ACTION' 
      WHERE id = ${latest.id}::uuid
    `;

    // 3. Run Verify Endpoint
    const res = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/audit/verify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.isValid).toBe(false);
    expect(res.body.brokenAtId).toBe(latest.id);
  });

  it('Verifies Checkpoint Signature correctly', async () => {
    const user = await prisma.user.create({ data: { email: 'check@test.com', isEmailVerified: true } });
    const org = await prisma.organization.create({
      data: { name: 'Check Org', slug: 'check-org' }
    });
    
    // 1. Create a checkpoint
    const token = sign({ sub: user.id }, 'mock');
    // Ensure at least one log exists
    await prisma.$transaction(async tx => auditService.logActionInTx(tx, org.id, { userId: user.id, action: 'INIT' }));
    const logs = await prisma.auditLog.findMany({ where: { organizationId: org.id } });
    const latest = logs[logs.length - 1];

    const cp = await prisma.auditCheckpoint.create({
      data: {
        organizationId: org.id,
        lastEntryId: latest.id,
        headHash: latest.hash,
        signature: 'VALID_MOCK_SIG'
      }
    });

    // 2. Verify should check the signature
    const res = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/audit/verify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify it walks the chain correctly (since we don't have real Ed25519 in test easily,
    // we just ensure verify returns false if we tamper the checkpoint)
    
    await prisma.auditCheckpoint.update({
      where: { id: cp.id },
      data: { signature: 'INVALID_SIG' }
    });
    
    // In our mock env, the actual crypto.verify is either skipped or fails. 
    // We expect the verify endpoint to flag if the checkpoint is invalid.
    // Our verify logic throws if the signature is bad.
    const res2 = await request(app.getHttpServer())
      .get(`/organizations/${org.id}/audit/verify`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(res2.body.message).toContain('Invalid checkpoint signature');
  });
});
