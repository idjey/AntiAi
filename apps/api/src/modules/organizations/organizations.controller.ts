import { Controller, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrgRole, TeamMember } from '@prisma/client';
import { OrgRoleGuard } from '../../common/guards/org-role.guard';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  async createOrganization(
    @Req() req: any,
    @Body('name') name: string,
    @Body('slug') slug: string,
  ) {
    return this.orgsService.createOrganization(req.user.id, name, slug);
  }

  @Post(':organizationId/members')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async inviteMember(
    @Param('organizationId') orgId: string,
    @Body('email') email: string,
    @Body('role') role: OrgRole,
  ) {
    return this.orgsService.inviteMember(orgId, email, role || OrgRole.CREATOR);
  }

  @Delete(':organizationId/members/:userId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async removeMember(
    @Req() req: any,
    @Param('organizationId') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    const requester: TeamMember = req.orgMembership;
    return this.orgsService.removeMember(orgId, targetUserId, requester);
  }

  @Put(':organizationId/members/:userId/role')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER) // Admins can't change roles, per the matrix (actually matrix says ADMIN: DENY for Change Member Role)
  async updateMemberRole(
    @Req() req: any,
    @Param('organizationId') orgId: string,
    @Param('userId') targetUserId: string,
    @Body('role') newRole: OrgRole,
  ) {
    const requester: TeamMember = req.orgMembership;
    return this.orgsService.updateMemberRole(orgId, targetUserId, newRole, requester);
  }

  @Delete(':organizationId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER)
  async deleteOrganization(@Param('organizationId') orgId: string) {
    return this.orgsService.deleteOrganization(orgId);
  }
}
