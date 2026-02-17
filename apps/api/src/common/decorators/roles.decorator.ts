
import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const Roles = (...roles: UserRole[]): CustomDecorator => SetMetadata('roles', roles);
