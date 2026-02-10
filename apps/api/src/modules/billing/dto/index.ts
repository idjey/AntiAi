import { IsString, IsEnum, IsUrl } from 'class-validator';

export class CheckoutDto {
    @IsEnum(['pro', 'elite'])
    plan: 'pro' | 'elite';

    @IsUrl()
    success_url: string;

    @IsUrl()
    cancel_url: string;
}
