'use client';

// This is a placeholder for a real analytics service (e.g., PostHog, Google Analytics, Mixpanel).
// For now, it logs events to the console in development mode.

type AnalyticsEvent =
    | 'link_click'
    | 'video_click'
    | 'video_scroll_interaction';

interface AnalyticsProperties {
    [key: string]: any;
}

export const useAnalytics = () => {
    const track = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
        // In a real app, you would send this to your analytics provider.
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Analytics] ${event}`, properties);
        }

        // Example integration:
        // window.gtag?.('event', event, properties);
        // posthog.capture(event, properties);
    };

    return { track };
};
