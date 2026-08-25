import { Controller, Post, Body, Param, Delete, Put, UseGuards, Req, Get, NotImplementedException } from '@nestjs/common';
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

  @Get(':organizationId/members/me')
  async getMemberMe(
    @Req() req: any,
    @Param('organizationId') orgId: string,
  ) {
    return this.orgsService.getMemberMe(orgId, req.user.id);
  }

  @Get(':organizationId')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.CREATOR)
  async getOrganization(@Param('organizationId') orgId: string) {
    return this.orgsService.getOrganization(orgId);
  }

  @Post(':organizationId/invites')
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

  @Post(':organizationId/invites/:inviteId/accept')
  async acceptInvite(
    @Req() req: any,
    @Param('organizationId') orgId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.orgsService.acceptInvite(orgId, inviteId, req.user.id);
  }

  @Delete(':organizationId/leave')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN, OrgRole.CREATOR)
  async leaveOrganization(
    @Req() req: any,
    @Param('organizationId') orgId: string,
  ) {
    const requester: TeamMember = req.orgMembership;
    return this.orgsService.leaveOrganization(orgId, requester);
  }

  @Post(':organizationId/transfer-ownership')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER)
  async transferOwnership(
    @Req() req: any,
    @Param('organizationId') orgId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    const requester: TeamMember = req.orgMembership;
    return this.orgsService.transferOwnership(orgId, targetUserId, requester);
  }

  @Post(':organizationId/buy-seats')
  @UseGuards(OrgRoleGuard)
  @OrgRoles(OrgRole.OWNER)
  async buySeats(
    @Param('organizationId') orgId: string,
    @Body('amount') amountStr?: string,
  ) {
    if (process.env.ENABLE_MOCK_BILLING !== 'true') {
      throw new NotImplementedException('Billing integration is not enabled');
    }
    const amount = amountStr ? parseInt(amountStr as any, 10) : 5;
    return this.orgsService.purchaseSeats(orgId, amount);
  }
}
