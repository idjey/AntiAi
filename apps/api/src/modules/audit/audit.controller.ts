import { Controller, Get, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgRoleGuard } from '../../common/guards/org-role.guard';
import { OrgRoles } from '../../common/decorators/org-roles.decorator';
import { OrgRole } from '@prisma/client';

@Controller('organizations/:orgId/audit')
@UseGuards(JwtAuthGuard, OrgRoleGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async getAuditLogs(@Param('orgId') orgId: string) {
    const logs = await this.auditService.getLogs(orgId);
    return logs;
  }

  @Get('verify')
  @OrgRoles(OrgRole.OWNER, OrgRole.ADMIN)
  async verify(@Param('orgId') orgId: string) {
    const result = await this.auditService.verifyChain(orgId);
    return result;
  }
}
