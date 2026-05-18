import { IsString, IsEnum, IsUrl, IsOptional } from 'class-validator';

export class CheckoutDto {
    @IsEnum(['pro', 'business', 'elite'], { message: 'Plan must be pro, business, or elite' })
    plan: 'pro' | 'business' | 'elite';

    @IsEnum(['month', 'year'], { message: 'Interval must be month or year' })
    interval: 'month' | 'year';

    @IsString()
    success_url: string;

    @IsString()
    cancel_url: string;

    @IsOptional()
    @IsString()
    couponCode?: string;
}

export class BillingPortalDto {
    return_url: string;
}
