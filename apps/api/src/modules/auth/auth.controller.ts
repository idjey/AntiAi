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
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
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
    @Post('change-password')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async changePassword(@CurrentUser() user: any, @Body() dto: any) {
        return this.authService.changePassword(user.id, dto);
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
}
