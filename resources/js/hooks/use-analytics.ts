import axios from 'axios';
import { useCallback } from 'react';

type EventType = 'click' | 'view' | 'funnel_step';

type EventCategory =
    | 'event_card'
    | 'register_button'
    | 'event_detail'
    | 'registration'
    | 'banner'
    | 'webinar_card'
    | 'podcast_card';

/**
 * Fire-and-forget analytics tracking hook.
 * Sends client-side events to the /track endpoint.
 * Never throws — all errors are silently swallowed.
 */
export function useAnalytics() {
    const track = useCallback(
        (
            eventType: EventType,
            eventCategory: EventCategory,
            eventLabel?: string,
            eventData?: Record<string, string>,
        ): void => {
            // Never track inside admin or user dashboard
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                return;
            }

            axios
                .post('/track', {
                    event_type: eventType,
                    event_category: eventCategory,
                    event_label: eventLabel ?? null,
                    event_data: eventData ?? null,
                })
                .catch(() => {
                    // Intentionally silent — analytics must never affect UX
                });
        },
        [],
    );

    return { track };
}
