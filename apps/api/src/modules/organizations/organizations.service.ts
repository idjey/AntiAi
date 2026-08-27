import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole, TeamMember } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrganizationsService {
  public static readonly DEFAULT_FREE_SEATS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createOrganization(userId: string, name: string, slug: string) {
    return this.prisma.organization.create({
      data: {
        name,
        slug,
        teamMembers: {
          create: {
            userId,
            role: OrgRole.OWNER,
          }
        }
      }
    });
  }

  async getOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true
              }
            }
          }
        },
        pendingInvites: {
          where: {
            status: 'PENDING'
          }
        }
      }
    });

    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    return org;
  }

  async getMemberMe(organizationId: string, userId: string) {
    const membership = await this.prisma.teamMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    return membership;
  }

  async inviteMember(organizationId: string, email: string, role: OrgRole) {
    const existingUser = await this.prisma.user.findUnique({ 
      where: { email }, 
      include: { teamMemberships: { where: { organizationId } } } 
    });
    if (existingUser && existingUser.teamMemberships.length > 0) {
      throw new ConflictException('User is already a member');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      // 1. Audit Chain Serialization Lock (two-argument to prevent collision)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      // Lock the organization row to prevent TOCTOU race condition for seats
      const orgs = await tx.$queryRaw<{ max_seats: number }[]>`
        SELECT max_seats FROM organizations WHERE id = ${organizationId}::uuid FOR UPDATE
      `;
      
      if (!orgs || orgs.length === 0) {
        throw new BadRequestException('Organization not found');
      }

      const maxSeats = orgs[0].max_seats;

      const memberCount = await tx.teamMember.count({ where: { organizationId } });
      const pendingCount = await tx.pendingInvite.count({ where: { organizationId, status: 'PENDING' } });
      
      const isExistingPending = await tx.pendingInvite.findUnique({
        where: { organizationId_email: { organizationId, email } }
      });
      
      // If updating an existing pending invite, it doesn't consume an additional seat
      const additionalSeat = isExistingPending && isExistingPending.status === 'PENDING' ? 0 : 1;

      if (memberCount + pendingCount + additionalSeat > maxSeats) {
        throw new ConflictException('Seat limit reached. Please purchase more seats.');
      }

      const invite = await tx.pendingInvite.upsert({
        where: {
          organizationId_email: {
            organizationId,
            email,
          }
        },
        create: {
          organizationId,
          email,
          role,
          status: 'PENDING',
          expiresAt,
        },
        update: {
          role,
          status: 'PENDING',
          expiresAt,
        }
      });

      await this.auditService.logActionInTx(tx, organizationId, {
        action: 'MEMBER_INVITED',
        entityType: 'PendingInvite',
        entityId: invite.id,
        metadata: { email, role },
      });

      return invite;
    }));
  }

  async acceptInvite(organizationId: string, inviteId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email must be verified to accept an invite');
    }

    const invite = await this.prisma.pendingInvite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new BadRequestException('Invite not found');
    if (invite.organizationId !== organizationId) throw new ForbiddenException('Invalid organization');
    if (invite.email !== user.email) throw new ForbiddenException('Invite email does not match user email');
    if (invite.status !== 'PENDING') throw new BadRequestException('Invite is no longer pending');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');

    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      await tx.pendingInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      });

      const member = await tx.teamMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: invite.role,
        }
      });

      await this.auditService.logActionInTx(tx, organizationId, {
        userId,
        action: 'INVITE_ACCEPTED',
        entityType: 'TeamMember',
        entityId: member.id,
        metadata: { role: invite.role },
      });

      return member;
    }));
  }

  async removeMember(organizationId: string, targetUserId: string, requester: TeamMember) {
    const targetMembership = await this.prisma.teamMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } }
    });
    if (!targetMembership) throw new BadRequestException('Member not found');

    // Rule: ADMINs can remove CREATORs, but DENY an ADMIN attempting to remove an OWNER or ADMIN
    if (requester.role === OrgRole.ADMIN) {
      if (targetMembership.role === OrgRole.OWNER || targetMembership.role === OrgRole.ADMIN) {
        throw new ForbiddenException('Admins cannot remove owners or other admins');
      }
    }

    // Rule: Cannot remove the last owner
    if (targetMembership.role === OrgRole.OWNER) {
      const ownerCount = await this.prisma.teamMember.count({
        where: { organizationId, role: OrgRole.OWNER }
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner of the organization');
      }
    }

    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      const deleted = await tx.teamMember.delete({
        where: { organizationId_userId: { organizationId, userId: targetUserId } }
      });

      await this.auditService.logActionInTx(tx, organizationId, {
        userId: requester.userId,
        action: 'MEMBER_REMOVED',
        entityType: 'TeamMember',
        entityId: deleted.id,
        metadata: { removedUserId: targetUserId, role: targetMembership.role },
      });

      return deleted;
    }));
  }

  async updateMemberRole(organizationId: string, targetUserId: string, newRole: OrgRole, requester: TeamMember) {
    const targetMembership = await this.prisma.teamMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } }
    });
    if (!targetMembership) throw new BadRequestException('Member not found');

    // Rule: A member cannot escalate their own privileges
    if (targetUserId === requester.userId && newRole !== targetMembership.role) {
      // Actually, can they demote themselves? Yes, unless they are the last owner.
      // But let's prevent self-escalation
      if (requester.role === OrgRole.ADMIN && newRole === OrgRole.OWNER) {
        throw new ForbiddenException('Cannot escalate your own role');
      }
    }

    // Rule: ADMINs cannot modify OWNER roles
    if (requester.role === OrgRole.ADMIN) {
      if (targetMembership.role === OrgRole.OWNER || newRole === OrgRole.OWNER) {
        throw new ForbiddenException('Admins cannot grant or revoke owner role');
      }
    }

    // Rule: No role can demote the last OWNER
    if (targetMembership.role === OrgRole.OWNER && newRole !== OrgRole.OWNER) {
      const ownerCount = await this.prisma.teamMember.count({
        where: { organizationId, role: OrgRole.OWNER }
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot demote the last owner of the organization');
      }
    }

    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      const updated = await tx.teamMember.update({
        where: { organizationId_userId: { organizationId, userId: targetUserId } },
        data: { role: newRole }
      });

      await this.auditService.logActionInTx(tx, organizationId, {
        userId: requester.userId,
        action: 'MEMBER_ROLE_UPDATED',
        entityType: 'TeamMember',
        entityId: updated.id,
        metadata: { targetUserId, oldRole: targetMembership.role, newRole },
      });

      return updated;
    }));
  }

  async deleteOrganization(organizationId: string) {
    try {
      return await this.prisma.organization.delete({
        where: { id: organizationId }
      });
    } catch (e: any) {
      // Prisma Restrict constraint violation
      if (e.code === 'P2003') {
        throw new ConflictException('Cannot delete organization with active financial records');
      }
      throw e;
    }
  }

  async leaveOrganization(organizationId: string, requester: TeamMember) {
    if (requester.role === OrgRole.OWNER) {
      const ownerCount = await this.prisma.teamMember.count({
        where: { organizationId, role: OrgRole.OWNER }
      });
      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot leave as the last owner of the organization');
      }
    }

    return this.prisma.teamMember.delete({
      where: { organizationId_userId: { organizationId, userId: requester.userId } }
    });
  }

  async transferOwnership(organizationId: string, targetUserId: string, requester: TeamMember) {
    if (targetUserId === requester.userId) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    const targetMembership = await this.prisma.teamMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: targetUserId } }
    });
    if (!targetMembership) {
      throw new BadRequestException('Target user is not a member of this organization');
    }

    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      // Promote target
      await tx.teamMember.update({
        where: { id: targetMembership.id },
        data: { role: OrgRole.OWNER }
      });

      // Demote self to ADMIN
      await tx.teamMember.update({
        where: { id: requester.id },
        data: { role: OrgRole.ADMIN }
      });

      // Assert post-transaction invariant
      const ownerCount = await tx.teamMember.count({
        where: { organizationId, role: OrgRole.OWNER }
      });
      if (ownerCount < 1) {
        throw new ConflictException('Ownership transfer resulted in zero owners');
      }

      await this.auditService.logActionInTx(tx, organizationId, {
        userId: requester.userId,
        action: 'OWNERSHIP_TRANSFERRED',
        entityType: 'Organization',
        entityId: organizationId,
        metadata: { newOwnerId: targetUserId },
      });

      return { success: true };
    }));
  }

  async purchaseSeats(organizationId: string, amount: number = 5) {
    return this.auditService.executeWithAuditRetry(() => this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log'), hashtext(${organizationId}::text))`;

      const orgs = await tx.$queryRaw<{ id: string, max_seats: number }[]>`
        SELECT id, max_seats FROM organizations WHERE id = ${organizationId}::uuid FOR UPDATE
      `;
      if (!orgs || orgs.length === 0) {
        throw new BadRequestException('Organization not found');
      }

      const updated = await tx.organization.update({
        where: { id: organizationId },
        data: {
          maxSeats: { increment: amount }
        }
      });

      await this.auditService.logActionInTx(tx, organizationId, {
        action: 'SEATS_PURCHASED',
        entityType: 'Organization',
        entityId: organizationId,
        metadata: { amountPurchased: amount, newMaxSeats: updated.maxSeats },
      });

      return updated;
    }));
  }
}
