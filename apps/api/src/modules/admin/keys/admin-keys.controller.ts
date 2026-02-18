
import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@antiai/database';
import { AdminKeysService } from './admin-keys.service';

@Controller('admin/keys')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
export class AdminKeysController {
    constructor(private readonly adminKeysService: AdminKeysService) { }

    @Get()
    async findAll() {
        return this.adminKeysService.findAll();
    }

    @Post()
    async create(@Request() req: any) {
        return this.adminKeysService.createKey(req.user.id);
    }

    @Post(':id/retire')
    async retire(@Param('id') id: string, @Request() req: any) {
        return this.adminKeysService.retireKey(id, req.user.id);
    }

    @Post(':id/active')
    async setActive(@Param('id') id: string) {
        return this.adminKeysService.setActive(id);
    }
}
