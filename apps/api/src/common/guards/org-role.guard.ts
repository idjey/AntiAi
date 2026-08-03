import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Extract organizationId from path params, body, or query
    const organizationId = request.params.organizationId || request.body.organizationId || request.query.organizationId;
    
    if (!organizationId) {
      throw new BadRequestException('Organization context missing from request');
    }

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id
        }
      }
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
    }

    // Attach membership to request for downstream use
    request.orgMembership = membership;

    return true;
  }
}
