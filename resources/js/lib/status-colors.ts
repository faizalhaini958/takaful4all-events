/**
 * Status → Badge variant mapping for consistent colour coding across the UI.
 *
 * Badge variants available in shadcn/ui:
 *   'default' (brand/primary), 'secondary', 'destructive', 'outline'
 *
 * We extend with custom CSS classes where needed via className overrides.
 */

import type { RegistrationStatus, PaymentStatus } from '@/types';

// ─── Registration Status ─────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const REGISTRATION_STATUS_MAP: Record<RegistrationStatus, { variant: BadgeVariant; className?: string }> = {
    confirmed:  { variant: 'default',     className: 'bg-emerald-600 hover:bg-emerald-600 text-white' },
    pending:    { variant: 'outline',     className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950' },
    waitlisted: { variant: 'outline',     className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950' },
    attended:   { variant: 'default',     className: 'bg-blue-600 hover:bg-blue-600 text-white' },
    cancelled:  { variant: 'destructive' },
};

export function registrationStatusBadge(status: RegistrationStatus) {
    return REGISTRATION_STATUS_MAP[status] ?? { variant: 'secondary' as const };
}

// ─── Payment Status ──────────────────────────────────────────────────────────

const PAYMENT_STATUS_MAP: Record<PaymentStatus, { variant: BadgeVariant; className?: string }> = {
    paid:     { variant: 'default',     className: 'bg-emerald-600 hover:bg-emerald-600 text-white' },
    pending:  { variant: 'outline',     className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950' },
    na:       { variant: 'secondary' },
    refunded: { variant: 'destructive' },
};

export function paymentStatusBadge(status: PaymentStatus) {
    return PAYMENT_STATUS_MAP[status] ?? { variant: 'secondary' as const };
}

// ─── Event / Ticket Availability ─────────────────────────────────────────────

type AvailabilityStatus = 'available' | 'limited' | 'fully_booked';

const AVAILABILITY_MAP: Record<AvailabilityStatus, { variant: BadgeVariant; className?: string }> = {
    available:    { variant: 'default',  className: 'bg-emerald-600 hover:bg-emerald-600 text-white' },
    limited:      { variant: 'outline',  className: 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950' },
    fully_booked: { variant: 'secondary', className: 'bg-gray-400 hover:bg-gray-400 text-white' },
};

export function availabilityBadge(availableCount: number | null): { label: string; variant: BadgeVariant; className?: string } {
    if (availableCount === null) {
        return { label: 'Available', ...AVAILABILITY_MAP.available };
    }
    if (availableCount <= 0) {
        return { label: 'Fully Booked', ...AVAILABILITY_MAP.fully_booked };
    }
    if (availableCount <= 10) {
        return { label: `${availableCount} left`, ...AVAILABILITY_MAP.limited };
    }
    return { label: 'Available', ...AVAILABILITY_MAP.available };
}

// ─── Event Status ────────────────────────────────────────────────────────────

type EventStatus = 'draft' | 'upcoming' | 'past';

const EVENT_STATUS_MAP: Record<EventStatus, BadgeVariant> = {
    upcoming: 'default',
    past:     'secondary',
    draft:    'outline',
};

export function eventStatusBadgeVariant(status: EventStatus): BadgeVariant {
    return EVENT_STATUS_MAP[status] ?? 'secondary';
}

// ─── User Roles ──────────────────────────────────────────────────────────────

type UserRole = 'admin' | 'editor' | 'company' | 'public';

const ROLE_BADGE_MAP: Record<UserRole, { variant: BadgeVariant; className?: string }> = {
    admin:   { variant: 'default',     className: 'bg-violet-600 hover:bg-violet-600 text-white' },
    editor:  { variant: 'default',     className: 'bg-sky-600 hover:bg-sky-600 text-white' },
    company: { variant: 'default',     className: 'bg-amber-600 hover:bg-amber-600 text-white' },
    public:  { variant: 'secondary' },
};

export function roleBadgeVariant(role: UserRole): BadgeVariant {
    return ROLE_BADGE_MAP[role]?.variant ?? 'secondary';
}

export function roleBadge(role: UserRole) {
    return ROLE_BADGE_MAP[role] ?? { variant: 'secondary' as const };
}
