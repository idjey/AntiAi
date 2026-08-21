import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole, TeamMember } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.pendingInvite.upsert({
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

    return this.prisma.$transaction(async (tx) => {
      await tx.pendingInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' },
      });

      return tx.teamMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: invite.role,
        }
      });
    });
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

    return this.prisma.teamMember.delete({
      where: { organizationId_userId: { organizationId, userId: targetUserId } }
    });
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

    return this.prisma.teamMember.update({
      where: { organizationId_userId: { organizationId, userId: targetUserId } },
      data: { role: newRole }
    });
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

    return this.prisma.$transaction(async (tx) => {
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

      return { success: true };
    });
  }
}
