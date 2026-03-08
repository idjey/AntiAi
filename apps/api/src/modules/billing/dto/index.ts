import { IsString, IsEnum, IsUrl, IsOptional } from 'class-validator';

export class CheckoutDto {
    @IsEnum(['pro', 'elite'], { message: 'Plan must be pro or elite' })
    plan: 'pro' | 'elite';

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
