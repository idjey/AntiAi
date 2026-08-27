import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrgRole } from '@prisma/client';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { Controller, Post, Param, UseGuards, Req, Put } from '@nestjs/common';
import { OrgRoles } from '../src/common/decorators/org-roles.decorator';
import { OrgRoleGuard } from '../src/common/guards/org-role.guard';

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
          req.user = { id: userId };
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
    await prisma.teamMember.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();
  });

  afterAll(async () => {
    // Teardown everything created in this suite
    if (prisma) {
      await prisma.teamMember.deleteMany({});
      await prisma.organization.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.$disconnect();
    }
    if (app) await app.close();
  });

  describe('Cross-Org Isolation & Explicit Deny Paths', () => {
    let orgAId: string;
    let orgBId: string;
    let userA1Id: string; // Org A Admin
    let userA2Id: string; // Org A Creator
    let userBId: string; // Org B Owner
    let outsiderId: string; // Not in any org

    beforeAll(async () => {
      // 1. Create Users
      const users = await Promise.all([
        prisma.user.create({ data: { email: 'a1@test.com' } }),
        prisma.user.create({ data: { email: 'a2@test.com' } }),
        prisma.user.create({ data: { email: 'b@test.com' } }),
        prisma.user.create({ data: { email: 'out@test.com' } }),
      ]);
      userA1Id = users[0].id;
      userA2Id = users[1].id;
      userBId = users[2].id;
      outsiderId = users[3].id;

      // 2. Create Orgs
      const orgA = await prisma.organization.create({ data: { name: 'Org A', slug: 'org-a' } });
      orgAId = orgA.id;
      
      const orgB = await prisma.organization.create({ data: { name: 'Org B', slug: 'org-b' } });
      orgBId = orgB.id;

      // 3. Assign Memberships
      await prisma.teamMember.createMany({
        data: [
          { organizationId: orgAId, userId: userA1Id, role: OrgRole.ADMIN },
          { organizationId: orgAId, userId: userA2Id, role: OrgRole.CREATOR },
          { organizationId: orgBId, userId: userBId, role: OrgRole.OWNER },
        ]
      });
    });

    it('DENY: User from Org B cannot remove member from Org A', async () => {
      // User B tries to remove User A2 from Org A
      const res = await request(app.getHttpServer())
        .delete(`/organizations/${orgAId}/members/${userA2Id}`)
        .set('x-mock-user-id', userBId);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toEqual('User is not a member of this organization');
    });

    it('DENY: Outsider cannot invite member to Org A', async () => {
      const res = await request(app.getHttpServer())
        .post(`/organizations/${orgAId}/members`)
        .set('x-mock-user-id', outsiderId)
        .send({ email: 'new@test.com', role: OrgRole.CREATOR });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toEqual('User is not a member of this organization');
    });

    it('DENY: Member (insufficient role) cannot remove another member in same Org', async () => {
      // User A2 (CREATOR) tries to remove User A1 (ADMIN) from Org A
      const res = await request(app.getHttpServer())
        .delete(`/organizations/${orgAId}/members/${userA1Id}`)
        .set('x-mock-user-id', userA2Id);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Requires one of roles');
    });

    it('DENY: Admin cannot escalate their own privilege to Owner', async () => {
      // User A1 (ADMIN) tries to make themselves OWNER
      const res = await request(app.getHttpServer())
        .put(`/organizations/${orgAId}/members/${userA1Id}/role`)
        .set('x-mock-user-id', userA1Id)
        .send({ role: OrgRole.OWNER });
      
      expect(res.status).toBe(403);
      // Wait, Admin doesn't even have access to the PUT route per controller rules (requires OWNER)
      expect(res.body.message).toContain('Requires one of roles: OWNER');
    });

    describe('Resource Actions (Proofs & Billing)', () => {
      it('ALLOW: Creator can issue proofs for their own org', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/proofs`)
          .set('x-mock-user-id', userA2Id);
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      });

      it('DENY: Member of Org B cannot issue proofs for Org A', async () => {
        const res = await request(app.getHttpServer())
          .post(`/organizations/${orgAId}/proofs`)
          .set('x-mock-user-id', userBId); // userB is OWNER of orgB, but shouldn't issue in orgA
        
        expect(res.status).toBe(403);
      });

      it('DENY: Creator cannot change billing settings', async () => {
        const res = await request(app.getHttpServer())
          .put(`/organizations/${orgAId}/billing`)
          .set('x-mock-user-id', userA2Id); // userA2 is CREATOR
        
        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Requires one of roles: OWNER');
      });
    });
  });

  describe('Last Owner Protection', () => {
    let orgCId: string;
    let ownerId: string;
    let adminId: string;

    beforeAll(async () => {
      const users = await Promise.all([
        prisma.user.create({ data: { email: 'ownc@test.com' } }),
        prisma.user.create({ data: { email: 'adminc@test.com' } }),
      ]);
      ownerId = users[0].id;
      adminId = users[1].id;

      const orgC = await prisma.organization.create({ data: { name: 'Org C', slug: 'org-c' } });
      orgCId = orgC.id;

      await prisma.teamMember.createMany({
        data: [
          { organizationId: orgCId, userId: ownerId, role: OrgRole.OWNER },
          { organizationId: orgCId, userId: adminId, role: OrgRole.ADMIN },
        ]
      });
    });

    it('DENY: Owner cannot remove themselves if they are the last owner', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/organizations/${orgCId}/members/${ownerId}`)
        .set('x-mock-user-id', ownerId);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toEqual('Cannot remove the last owner of the organization');
    });

    it('DENY: Owner cannot demote themselves to member if they are the last owner', async () => {
      const res = await request(app.getHttpServer())
        .put(`/organizations/${orgCId}/members/${ownerId}/role`)
        .set('x-mock-user-id', ownerId)
        .send({ role: OrgRole.CREATOR });
      
      expect(res.status).toBe(403);
      expect(res.body.message).toEqual('Cannot demote the last owner of the organization');
    });
  });
});
