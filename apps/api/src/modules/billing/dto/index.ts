export class CheckoutDto {
    plan: 'pro' | 'elite';
    interval: 'month' | 'year';
    success_url: string;
    cancel_url: string;
}

export class BillingPortalDto {
    return_url: string;
}
