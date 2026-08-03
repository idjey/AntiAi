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

  async inviteMember(organizationId: string, email: string, role: OrgRole) {
    const targetUser = await this.prisma.user.findUnique({ where: { email } });
    if (!targetUser) throw new BadRequestException('User not found');

    try {
      return await this.prisma.teamMember.create({
        data: {
          organizationId,
          userId: targetUser.id,
          role,
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('User is already a member');
      throw e;
    }
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
}
