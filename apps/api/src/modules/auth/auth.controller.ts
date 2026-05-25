import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Query,
    Req,
    Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('signup')
    // @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async signup(@Body() dto: SignupDto) {
        return this.authService.signup(dto);
    }

    @Post('login')
    // @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        return this.authService.login(dto, req);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    async me(@CurrentUser() user: any) {
        return this.authService.getMe(user.id);
    }
    @Get('check-handle')
    async checkHandle(@Query('handle') handle: string) {
        if (!handle || handle.length < 3) {
            return { available: false, error: 'Handle must be at least 3 characters' };
        }
        return this.authService.checkHandle(handle);
    }

    @Post('verify-otp')
    // @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
        return this.authService.verifyOtp(email, otp);
    }

    @Post('resend-otp')
    @HttpCode(HttpStatus.OK)
    async resendOtp(@Body('email') email: string) {
        return this.authService.resendOtp(email);
    }
    @Post('change-password')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async changePassword(@CurrentUser() user: any, @Body() dto: any) {
        return this.authService.changePassword(user.id, dto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: any) {
        return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
    }
    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req: any) {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req: any, @Res() res: any) {
        const result = await this.authService.validateOAuthUser(req.user);
        // Redirect to frontend with token
        // Use environment variable for frontend URL in production
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
    }

    // --- 2FA Endpoints ---

    @Post('2fa/generate')
    @UseGuards(AuthGuard('jwt'))
    async generate2fa(@CurrentUser() user: any) {
        return this.authService.generate2faSecret(user.id);
    }

    @Post('2fa/enable')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async enable2fa(@CurrentUser() user: any, @Body('code') code: string) {
        return this.authService.enable2fa(user.id, code);
    }

    @Post('2fa/disable')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async disable2fa(@CurrentUser() user: any, @Body('code') code: string) {
        return this.authService.disable2fa(user.id, code);
    }

    @Post('2fa/verify-login')
    @HttpCode(HttpStatus.OK)
    async verify2faLogin(
        @Body('tempToken') tempToken: string,
        @Body('code') code: string,
        @Req() req: Request
    ) {
        return this.authService.verify2faLogin(tempToken, code, req);
    }
}
