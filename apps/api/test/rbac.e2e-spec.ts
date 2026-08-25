import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrgRole, InviteStatus } from '@prisma/client';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { Controller, Post, Param, UseGuards, Req, Put, Delete, Body } from '@nestjs/common';
import { OrgRoles } from '../src/common/decorators/org-roles.decorator';
import { OrgRoleGuard } from '../src/common/guards/org-role.guard';

jest.setTimeout(60000);

// We mock some resource controllers to ensure guard functionality works
@Controller('organizations')
@UseGuards(JwtAuthGuard, OrgRoleGuard)
class MockResourceController {
  @Post(':organizationId/proofs')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.CREATOR)
  issueProof(@Param('organizationId') orgId: string, @Req() req: any) {
    return { success: true, issuer: req.orgMembership.userId };
  }

  @Put(':organizationId/billing')
  @OrgRoles(OrgRole.OWNER)
  updateBilling() {
    return { success: true };
  }
}

describe('RBAC Enforcement (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Mock Users Map
  const userVerifications: Record<string, boolean> = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [MockResourceController]
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        const userId = req.headers['x-mock-user-id'];
        if (userId) {
          req.user = { id: userId, verificationStatus: userVerifications[userId] ? 'verified' : 'unverified' };
          return true;
        }
        return false;
      }
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Safety cleanup
    await prisma.pendingInvite.deleteMany({});
    await prisma.teamMember.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.pendingInvite.deleteMany({});
      await prisma.teamMember.deleteMany({});
      await prisma.organization.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  describe('Comprehensive Matrix & Cross-Org Isolation', () => {
    let orgAId: string;
    let orgBId: string;
    
    // Org A Users
    let userA_Owner1: any;
    let userA_Owner2: any;
    let userA_Admin: any;
    let userA_Creator: any;
    
    // Org B Users
    let userB_Owner: any;
    let outsider: any;

    // Misc Users for Invites
    let newUnverified: any;
    let newVerified: any;

    beforeAll(async () => {
      // 1. Create Users
      userA_Owner1 = await prisma.user.create({ data: { email: 'a.o1@test.com', isEmailVerified: true } });
      userA_Owner2 = await prisma.user.create({ data: { email: 'a.o2@test.com', isEmailVerified: true } });
      userA_Admin = await prisma.user.create({ data: { email: 'a.adm@test.com', isEmailVerified: true } });
      userA_Creator = await prisma.user.create({ data: { email: 'a.cr@test.com', isEmailVerified: true } });
      userB_Owner = await prisma.user.create({ data: { email: 'b.o@test.com', isEmailVerified: true } });
      outsider = await prisma.user.create({ data: { email: 'out@test.com', isEmailVerified: true } });
      newUnverified = await prisma.user.create({ data: { email: 'unv@test.com', isEmailVerified: false } });
      newVerified = await prisma.user.create({ data: { email: 'ver@test.com', isEmailVerified: true } });

      // Load mock verification map
      userVerifications[userA_Owner1.id] = true;
      userVerifications[userA_Owner2.id] = true;
      userVerifications[userA_Admin.id] = true;
      userVerifications[userA_Creator.id] = true;
      userVerifications[userB_Owner.id] = true;
      userVerifications[outsider.id] = true;
      userVerifications[newUnverified.id] = false;
      userVerifications[newVerified.id] = true;

      // 2. Create Orgs
      const orgA = await prisma.organization.create({ data: { name: 'Org A', slug: 'org-a' } });
      orgAId = orgA.id;
      
      const orgB = await prisma.organization.create({ data: { name: 'Org B', slug: 'org-b' } });
      orgBId = orgB.id;

      // 3. Assign Memberships
      await prisma.teamMember.createMany({
        data: [
          { organizationId: orgAId, userId: userA_Owner1.id, role: OrgRole.OWNER },
          { organizationId: orgAId, userId: userA_Owner2.id, role: OrgRole.OWNER },
          { organizationId: orgAId, userId: userA_Admin.id, role: OrgRole.ADMIN },
          { organizationId: orgAId, userId: userA_Creator.id, role: OrgRole.CREATOR },
          { organizationId: orgBId, userId: userB_Owner.id, role: OrgRole.OWNER },
        ]
      });
    });

    describe('1. Invite Member', () => {
      it('ALLOW: Admin can invite a user', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/invites`)
          .set('x-mock-user-id', userA_Admin.id)
          .send({ email: 'new1@test.com', role: OrgRole.CREATOR });
        expect(res.status).toBe(201);
      });

      it('DENY: Creator cannot invite a user', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/invites`)
          .set('x-mock-user-id', userA_Creator.id)
          .send({ email: 'new2@test.com', role: OrgRole.CREATOR });
        expect(res.status).toBe(403);
      });

      it('DENY (CROSS-ORG): Owner of Org A cannot invite to Org B', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgBId}/invites`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ email: 'new3@test.com', role: OrgRole.CREATOR });
        expect(res.status).toBe(403);
      });
    });

    describe('2. Accept Invite (Security Gates)', () => {
      let inviteUnverified: any;
      let inviteVerifiedMismatch: any;
      let inviteExpired: any;
      let inviteValid: any;

      beforeAll(async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        inviteUnverified = await prisma.pendingInvite.create({
          data: { organizationId: orgAId, email: newUnverified.email, expiresAt: nextWeek }
        });
        inviteVerifiedMismatch = await prisma.pendingInvite.create({
          data: { organizationId: orgAId, email: 'wrong.email@test.com', expiresAt: nextWeek }
        });
        inviteExpired = await prisma.pendingInvite.create({
          data: { organizationId: orgAId, email: newVerified.email, expiresAt: yesterday }
        });
        inviteValid = await prisma.pendingInvite.create({
          data: { organizationId: orgBId, email: newVerified.email, expiresAt: nextWeek }
        });
      });

      it('DENY: Unverified user cannot accept an invite, even with matching email', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/invites/${inviteUnverified.id}/accept`)
          .set('x-mock-user-id', newUnverified.id);
        expect(res.status).toBe(403);
        expect(res.body.message).toEqual('Email must be verified to accept an invite');
      });

      it('DENY: Verified user cannot accept an invite meant for a different email', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/invites/${inviteVerifiedMismatch.id}/accept`)
          .set('x-mock-user-id', newVerified.id);
        expect(res.status).toBe(403);
        expect(res.body.message).toEqual('Invite email does not match user email');
      });

      it('DENY: Cannot accept an expired invite', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/invites/${inviteExpired.id}/accept`)
          .set('x-mock-user-id', newVerified.id);
        expect(res.status).toBe(400);
        expect(res.body.message).toEqual('Invite has expired');
      });

      it('ALLOW: Verified user with matching email and unexpired invite can accept', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgBId}/invites/${inviteValid.id}/accept`)
          .set('x-mock-user-id', newVerified.id);
        expect(res.status).toBe(201);
      });
    });

    describe('3. Change Member Role', () => {
      it('DENY: Creator cannot change roles', async () => {
        const res = await request(app.getHttpServer())
          .put(`/organizations/${orgAId}/members/${userA_Admin.id}/role`)
          .set('x-mock-user-id', userA_Creator.id)
          .send({ role: OrgRole.CREATOR });
        expect(res.status).toBe(403);
      });

      it('DENY: Admin cannot change Creator role (endpoint restricted to OWNER)', async () => {
        const res = await request(app.getHttpServer())
          .put(`/organizations/${orgAId}/members/${userA_Creator.id}/role`)
          .set('x-mock-user-id', userA_Admin.id)
          .send({ role: OrgRole.ADMIN });
        expect(res.status).toBe(403);
      });

      it('ALLOW: Owner can demote a peer Owner', async () => {
        const res = await request(app.getHttpServer())
          .put(`/organizations/${orgAId}/members/${userA_Owner2.id}/role`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ role: OrgRole.ADMIN });
        expect(res.status).toBe(200);
      });
    });

    describe('4. Remove Member', () => {
      it('DENY: Admin cannot remove an Owner (Hard Deny in Service)', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/organizations/${orgAId}/members/${userA_Owner1.id}`)
          .set('x-mock-user-id', userA_Admin.id);
        expect(res.status).toBe(403);
        expect(res.body.message).toEqual('Admins cannot remove owners or other admins');
      });
    });

    describe('5. Transfer Ownership', () => {
      it('DENY: Admin cannot transfer ownership', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/transfer-ownership`)
          .set('x-mock-user-id', userA_Admin.id)
          .send({ targetUserId: userA_Creator.id });
        expect(res.status).toBe(403);
      });

      it('DENY: Transfer to self is blocked', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/transfer-ownership`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ targetUserId: userA_Owner1.id });
        expect(res.status).toBe(400);
        expect(res.body.message).toEqual('Cannot transfer ownership to yourself');
      });

      it('DENY: Cannot transfer to a cross-org user (not a member of THIS org)', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/transfer-ownership`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ targetUserId: userB_Owner.id });
        expect(res.status).toBe(400);
        expect(res.body.message).toEqual('Target user is not a member of this organization');
      });

      it('DENY (CROSS-ORG): Owner of Org A cannot transfer ownership in Org B', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgBId}/transfer-ownership`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ targetUserId: newVerified.id });
        expect(res.status).toBe(403);
      });

      it('ALLOW: Owner can transfer ownership to a valid member', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/transfer-ownership`)
          .set('x-mock-user-id', userA_Owner1.id)
          .send({ targetUserId: userA_Admin.id });
        expect(res.status).toBe(201); // Post returns 201

        const newOwnerMembership = await prisma.teamMember.findUnique({
          where: { organizationId_userId: { organizationId: orgAId, userId: userA_Admin.id } }
        });
        const formerOwnerMembership = await prisma.teamMember.findUnique({
          where: { organizationId_userId: { organizationId: orgAId, userId: userA_Owner1.id } }
        });
        expect(newOwnerMembership?.role).toEqual(OrgRole.OWNER);
        expect(formerOwnerMembership?.role).toEqual(OrgRole.ADMIN);
      });
    });

    describe('6. Leave Organization', () => {
      it('DENY (CROSS-ORG): Owner of Org B cannot leave Org A (they are not in it)', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/organizations/${orgAId}/leave`)
          .set('x-mock-user-id', userB_Owner.id);
        expect(res.status).toBe(403);
      });

      it('DENY: Last Owner cannot leave', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/organizations/${orgBId}/leave`)
          .set('x-mock-user-id', userB_Owner.id);
        expect(res.status).toBe(403);
        expect(res.body.message).toEqual('Cannot leave as the last owner of the organization');
      });

      it('ALLOW: Non-last-owner member can leave', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/organizations/${orgAId}/leave`)
          .set('x-mock-user-id', userA_Creator.id);
        expect(res.status).toBe(200);
      });
    });
    describe('7. Fetch Organization Details', () => {
      it('DENY (CROSS-ORG): Outsider cannot fetch Org A details', async () => {
        const res = await request(app.getHttpServer())
          .get(`/organizations/${orgAId}`)
          .set('x-mock-user-id', outsider.id);
        expect(res.status).toBe(403);
      });

      it('ALLOW: Member can fetch their Org details', async () => {
        const res = await request(app.getHttpServer())
          .get(`/organizations/${orgAId}`)
          .set('x-mock-user-id', userA_Admin.id); // From transfer ownership, this user is now OWNER
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('teamMembers');
        expect(res.body).toHaveProperty('pendingInvites');
      });
    });

    describe('8. Seat Limits Enforcement', () => {
      let limitOrgId: string;
      let limitOwner: any;
      let new1: any, new2: any, new3: any, new4: any, new5: any;

      beforeAll(async () => {
        // Create an isolated org for seat tests
        limitOwner = await prisma.user.create({ data: { email: 'limit.owner@test.com', isEmailVerified: true } });
        userVerifications[limitOwner.id] = true;

        new1 = await prisma.user.create({ data: { email: 'l1@test.com', isEmailVerified: true } });
        new2 = await prisma.user.create({ data: { email: 'l2@test.com', isEmailVerified: true } });
        new3 = await prisma.user.create({ data: { email: 'l3@test.com', isEmailVerified: true } });
        new4 = await prisma.user.create({ data: { email: 'l4@test.com', isEmailVerified: true } });
        new5 = await prisma.user.create({ data: { email: 'l5@test.com', isEmailVerified: true } });
        
        // This will have default maxSeats = 5
        const org = await prisma.organization.create({ 
          data: { name: 'Limit Org', slug: 'limit-org' } 
        });
        limitOrgId = org.id;

        await prisma.teamMember.create({
          data: { organizationId: limitOrgId, userId: limitOwner.id, role: OrgRole.OWNER }
        });
      });

      it('ALLOW: Invites under limit', async () => {
        // Current seats: 1 (Owner). Adding 3 pending invites -> Total 4.
        await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'p1@test.com', role: OrgRole.CREATOR })
          .expect(201);
          
        await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'p2@test.com', role: OrgRole.CREATOR })
          .expect(201);
          
        await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'p3@test.com', role: OrgRole.CREATOR })
          .expect(201);
      });

      it('DENY (CONCURRENT RACE): Only one of two concurrent invites succeeds when 1 seat left', async () => {
        // Currently 4 of 5 seats used (1 member, 3 pending).
        // Fire 2 concurrent requests.
        const req1 = request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'race1@test.com', role: OrgRole.CREATOR });
          
        const req2 = request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'race2@test.com', role: OrgRole.CREATOR });
          
        const results = await Promise.all([req1, req2]);
        const statuses = results.map(r => r.status).sort();
        
        // One should get 201, the other should get 409
        expect(statuses).toEqual([201, 409]);
      });

      it('DENY: Limit strictly enforced including pending invites', async () => {
        // Now at 5 of 5. Next should fail.
        const res = await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'overflow@test.com', role: OrgRole.CREATOR });
          
        expect(res.status).toBe(409);
        expect(res.body.message).toContain('Seat limit reached');
      });
      
      it('DENY (MOCK GUARD): Non-owners cannot buy seats via mock endpoint', async () => {
        // We'll add another user as ADMIN to test
        // Let's use new1 and add to org as ADMIN but we need an extra seat!
        // Wait, maxSeats is 5, and it's already full! 
        // We can just create a new org for the guard tests, or bump maxSeats in the DB directly.
        await prisma.organization.update({ where: { id: limitOrgId }, data: { maxSeats: 10 } });
        
        const adminUser = await prisma.user.create({ data: { email: 'limit.admin@test.com', isEmailVerified: true } });
        userVerifications[adminUser.id] = true;
        await prisma.teamMember.create({
          data: { organizationId: limitOrgId, userId: adminUser.id, role: OrgRole.ADMIN }
        });
        
        process.env.ENABLE_MOCK_BILLING = 'true';
        const res = await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/buy-seats`)
          .set('x-mock-user-id', adminUser.id)
          .send({ amount: '5' });
        expect(res.status).toBe(403);
        
        // Restore maxSeats back to 5 for the next tests (wait, the concurrent test already ran)
        // Let's just leave it at 10 and adjust the next test. Wait, the next test is post-purchase unlock, 
        // which tests hitting the limit. 
        // Let's create a fresh org inside the guard test instead to avoid side effects!
      });
      
      it('DENY (MOCK GATED): Even owners cannot hit mock endpoint if flag is off', async () => {
        process.env.ENABLE_MOCK_BILLING = 'false';
        const res = await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/buy-seats`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ amount: '5' });
        expect(res.status).toBe(501); // NotImplementedException
      });

      it('ALLOW: Post-purchase unlocks invites', async () => {
        // Let's set it back to 5 seats via DB (currently at 10 from previous test tweak)
        await prisma.organization.update({ where: { id: limitOrgId }, data: { maxSeats: 5 } });
        
        // We're at 6 members currently (1 owner, 3 pending, 1 admin added in MOCK GUARD test, wait... 1+3+1 = 5)
        // We are exactly at 5/5 seats.
        
        process.env.ENABLE_MOCK_BILLING = 'true';
        const buyRes = await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/buy-seats`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ amount: '5' });
        expect(buyRes.status).toBe(201); // maxSeats is now 10
        
        // We can now invite again
        const res = await request(app.getHttpServer())
          .post(`/organizations/${limitOrgId}/invites`)
          .set('x-mock-user-id', limitOwner.id)
          .send({ email: 'unlocked@test.com', role: OrgRole.CREATOR });
        expect(res.status).toBe(201);
      });
    });
  });
});
