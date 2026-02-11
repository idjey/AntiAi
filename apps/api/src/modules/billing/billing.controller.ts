import {
    Controller,
    Get,
    Post,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    RawBodyRequest,
    Req,
    Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckoutDto } from './dto';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('status')
    @UseGuards(AuthGuard('jwt'))
    async getStatus(@CurrentUser() user: any) {
        return this.billingService.getStatus(user.id);
    }

    @Post('checkout')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
        return this.billingService.createCheckout(user.id, dto);
    }

    @Post('portal')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async portal(@CurrentUser() user: any, @Body() body: { return_url: string }) {
        return this.billingService.createPortalSession(user.id, body.return_url);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async webhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        return this.billingService.handleWebhook(req.rawBody!, signature);
    }
}
