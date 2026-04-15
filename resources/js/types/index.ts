// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Banner {
    id: number;
    title: string;
    image_path: string;
    image_url: string;
    mobile_image_path: string | null;
    mobile_image_url: string | null;
    link_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Media {
    id: number;
    disk: string;
    path: string;
    thumbnail_path: string | null;
    thumbnail_url: string | null;
    url: string;
    alt: string | null;
    title: string | null;
    mime: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    created_at: string;
    updated_at: string;
}

export interface Event {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content_html: string | null;
    start_at: string;
    end_at: string | null;
    venue: string | null;
    city: string | null;
    state: string | null;
    country: string;
    registration_url: string | null;
    gdrive_link: string | null;
    media_id: number | null;
    venue_map_media_id: number | null;
    media: Media | null;
    venue_map: Media | null;
    is_published: boolean;
    rsvp_enabled: boolean;
    rsvp_deadline: string | null;
    max_attendees: number | null;
    require_approval: boolean;
    status: 'draft' | 'upcoming' | 'past';
    registration_count?: number;
    is_registration_open?: boolean;
    meta_json: Record<string, unknown> | null;
    tickets?: EventTicket[];
    zones?: EventZone[];
    created_at: string;
    updated_at: string;
}

// ─── Tickets & Products ──────────────────────────────────────────────────────

export interface EventTicket {
    id: number;
    event_id: number;
    event_zone_id: number | null;
    name: string;
    color: string | null;
    description: string | null;
    type: 'free' | 'paid';
    price: number;
    early_bird_price: number | null;
    early_bird_end_at: string | null;
    current_price: number;
    is_early_bird: boolean;
    currency: string;
    quantity: number | null;
    max_per_order: number;
    sale_start_at: string | null;
    sale_end_at: string | null;
    is_active: boolean;
    sort_order: number;
    sold_count: number;
    available_count: number | null;
    is_on_sale: boolean;
    discount_tiers?: TicketDiscountTier[];
    zone?: EventZone | null;
    created_at: string;
    updated_at: string;
}

export interface ProductVariant {
    label: string;
    options: string[];
}

export interface EventProduct {
    id: number;
    event_id: number;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    variants_json: ProductVariant[] | null;
    stock: number | null;
    media_id: number | null;
    media: Media | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ─── Registrations / RSVP ────────────────────────────────────────────────────

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'waitlisted' | 'attended';
export type PaymentStatus = 'na' | 'pending' | 'paid' | 'refunded';

export interface EventRegistrationProduct {
    id: number;
    registration_id: number;
    product_id: number;
    product?: EventProduct;
    variant: string | null;
    quantity: number;
    unit_price: number;
    created_at: string;
    updated_at: string;
}

export interface EventRegistration {
    id: number;
    event_id: number;
    ticket_id: number;
    user_id: number | null;
    event?: Event;
    ticket?: EventTicket;
    user?: AuthUser;
    reference_no: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    dietary_requirements: string | null;
    status: RegistrationStatus;
    quantity: number;
    subtotal: number;
    discount_amount: number;
    products_total: number;
    total_amount: number;
    payment_status: PaymentStatus;
    payment_method: string | null;
    payment_reference: string | null;
    notes: string | null;
    checked_in_at: string | null;
    products?: EventRegistrationProduct[];
    invoice?: Invoice | null;
    meta_json: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface RegistrationStats {
    total: number;
    confirmed: number;
    pending: number;
    attended: number;
    cancelled: number;
    waitlisted: number;
    revenue: number;
}

export interface Page {
    id: number;
    title: string;
    slug: string;
    content_html: string | null;
    meta_json: Record<string, unknown> | null;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface Post {
    id: number;
    type: 'podcast' | 'webinar' | 'article' | 'agent360';
    title: string;
    slug: string;
    excerpt: string | null;
    content_html: string | null;
    embed_url: string | null;
    media_id: number | null;
    media: Media | null;
    is_published: boolean;
    published_at: string | null;
    meta_json: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface MenuItem {
    id: number;
    menu_id: number;
    label: string;
    url: string;
    target: string | null;
    sort: number;
    parent_id: number | null;
    children?: MenuItem[];
}

export interface Menu {
    id: number;
    name: string;
    slug: string;
    items: MenuItem[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'checkin_staff' | 'company' | 'public';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: UserRole;
    company_name: string | null;
    company_registration_no: string | null;
    company_address: string | null;
    company_phone: string | null;
    locale: string;
}

export interface TicketDiscountTier {
    id: number;
    event_ticket_id: number;
    min_quantity: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    created_at: string;
    updated_at: string;
}

// ─── Zones ───────────────────────────────────────────────────────────────────

export interface EventZone {
    id: number;
    event_id: number;
    name: string;
    description: string | null;
    color: string;
    label_color: string;
    perks: string[] | null;
    image_path: string | null;
    image_url: string | null;
    capacity: number | null;
    sort_order: number;
    tickets_count?: number;
    created_at: string;
    updated_at: string;
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export interface ShippingZone {
    id: number;
    name: string;
    countries: string[];
    states: string[] | null;
    rate: number;
    rate_type: 'flat' | 'per_item';
    free_shipping_min: number | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: number;
    registration_id: number;
    user_id: number | null;
    invoice_number: string;
    company_name: string | null;
    company_registration_no: string | null;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    issued_at: string;
    pdf_path: string | null;
    meta_json: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface DashboardStats {
    events: {
        total: number;
        upcoming: number;
        past: number;
        draft: number;
    };
    registrations: {
        total: number;
        confirmed: number;
        pending: number;
        revenue: number;
    };
    posts: {
        total: number;
        podcast: number;
        webinar: number;
        article: number;
    };
    pages: number;
    media: number;
}

// ─── Shared Inertia page props ────────────────────────────────────────────────

export interface SharedProps extends Record<string, unknown> {
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
    menus: Record<string, MenuItem[]>;
    translations: Record<string, string>;
    locale: string;
    availableLocales: Array<{ code: string; name: string }>;
}

// ─── PageProps (used by Breeze-generated pages) ───────────────────────────────

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: AuthUser;
    };
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};
