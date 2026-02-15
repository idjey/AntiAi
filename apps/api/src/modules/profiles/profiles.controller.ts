import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
    CreateProfileDto,
    UpdateProfileDto,
    CreateLinkDto,
    UpdateLinkDto,
    ReorderLinksDto,
} from './dto';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    // ==================== PROFILE ====================

    @Get()
    async getProfile(@CurrentUser() user: any) {
        return this.profilesService.getProfile(user.id);
    }

    @Post()
    @HttpCode(HttpStatus.OK)
    async createProfile(@CurrentUser() user: any, @Body() dto: CreateProfileDto) {
        return this.profilesService.createProfile(user.id, dto);
    }

    @Put()
    @HttpCode(HttpStatus.OK)
    async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
        console.log('Update Profile DTO:', JSON.stringify(dto, null, 2));
        return this.profilesService.updateProfile(user.id, dto);
    }

    // ==================== LINKS ====================

    @Get('links')
    async getLinks(@CurrentUser() user: any) {
        return this.profilesService.getLinks(user.id);
    }

    @Post('links')
    @HttpCode(HttpStatus.OK)
    async createLink(@CurrentUser() user: any, @Body() dto: CreateLinkDto) {
        return this.profilesService.createLink(user.id, dto);
    }

    @Put('links/:id')
    @HttpCode(HttpStatus.OK)
    async updateLink(
        @CurrentUser() user: any,
        @Param('id') linkId: string,
        @Body() dto: UpdateLinkDto,
    ) {
        return this.profilesService.updateLink(user.id, linkId, dto);
    }

    @Delete('links/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteLink(@CurrentUser() user: any, @Param('id') linkId: string) {
        return this.profilesService.deleteLink(user.id, linkId);
    }

    @Put('links/reorder')
    @HttpCode(HttpStatus.OK)
    async reorderLinks(@CurrentUser() user: any, @Body() dto: ReorderLinksDto) {
        return this.profilesService.reorderLinks(user.id, dto);
    }

    // ==================== HANDLE AVAILABILITY ====================

    @Get('check-handle/:handle')
    async checkHandle(@Param('handle') handle: string) {
        return this.profilesService.checkHandleAvailability(handle);
    }
}
