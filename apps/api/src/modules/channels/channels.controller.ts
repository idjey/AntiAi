import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Delete,
    Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VerifyStartDto, VerifyConfirmDto } from './dto';

@Controller('channels')
@UseGuards(AuthGuard('jwt'))
export class ChannelsController {
    constructor(private readonly channelsService: ChannelsService) { }

    @Get()
    async list(@CurrentUser() user: any) {
        return this.channelsService.listUserChannels(user.id);
    }

    @Post('verify/start')
    @HttpCode(HttpStatus.OK)
    async verifyStart(@CurrentUser() user: any, @Body() dto: VerifyStartDto) {
        return this.channelsService.startVerification(user.id, dto);
    }

    @Post('verify/confirm')
    @HttpCode(HttpStatus.OK)
    async verifyConfirm(@CurrentUser() user: any, @Body() dto: VerifyConfirmDto) {
        return this.channelsService.confirmVerification(user.id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async delete(@CurrentUser() user: any, @Param('id') id: string) {
        return this.channelsService.deleteChannel(user.id, id);
    }
}
