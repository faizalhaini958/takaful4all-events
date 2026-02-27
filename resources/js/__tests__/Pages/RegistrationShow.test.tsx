import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RegistrationShow from '@/Pages/Admin/Events/Registrations/Show';
import { type Event, type EventRegistration } from '@/types';

// Mock AdminLayout to just render children
vi.mock('@/Layouts/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: 1,
        title: 'Tech Summit 2026',
        slug: 'tech-summit-2026',
        excerpt: null,
        content_html: null,
        start_at: '2026-12-01T09:00:00.000Z',
        end_at: '2026-12-01T17:00:00.000Z',
        venue: 'KLCC',
        city: 'KL',
        state: 'WP KL',
        country: 'MY',
        registration_url: null,
        media_id: null,
        media: null,
        is_published: true,
        rsvp_enabled: true,
        rsvp_deadline: null,
        max_attendees: null,
        require_approval: false,
        status: 'upcoming',
        meta_json: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeRegistration(overrides: Partial<EventRegistration> = {}): EventRegistration {
    return {
        id: 1,
        event_id: 1,
        ticket_id: 1,
        reference_no: 'EVT-20260227-ABCD',
        name: 'Ali bin Ahmad',
        email: 'ali@example.com',
        phone: '+60123456789',
        company: 'Takaful Corp',
        job_title: 'Manager',
        dietary_requirements: 'Halal',
        status: 'confirmed',
        quantity: 1,
        subtotal: 150,
        products_total: 0,
        total_amount: 150,
        payment_status: 'paid',
        payment_method: 'FPX',
        payment_reference: 'FPX-12345',
        notes: 'Front row seat please',
        checked_in_at: null,
        products: [],
        meta_json: null,
        created_at: '2026-02-27T08:00:00.000Z',
        updated_at: '2026-02-27T08:00:00.000Z',
        ticket: {
            id: 1,
            event_id: 1,
            name: 'Early Bird',
            description: null,
            type: 'paid',
            price: 150,
            currency: 'MYR',
            quantity: 100,
            max_per_order: 5,
            sale_start_at: null,
            sale_end_at: null,
            is_active: true,
            sort_order: 0,
            sold_count: 10,
            available_count: 90,
            is_on_sale: true,
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
        },
        ...overrides,
    };
}

describe('Registration Show Page', () => {
    it('renders reference number', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('EVT-20260227-ABCD')).toBeInTheDocument();
    });

    it('renders primary attendee name and email', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Ali bin Ahmad')).toBeInTheDocument();
        expect(screen.getByText('ali@example.com')).toBeInTheDocument();
    });

    it('renders phone number', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('+60123456789')).toBeInTheDocument();
    });

    it('renders company', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Takaful Corp')).toBeInTheDocument();
    });

    it('renders job title', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('renders dietary requirements', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Halal')).toBeInTheDocument();
    });

    it('renders notes', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Front row seat please')).toBeInTheDocument();
    });

    it('renders status badge as Confirmed', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });

    it('renders pending status', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ status: 'pending' })} />);
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders order summary with ticket info', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
        // Price appears in both ticket line and total — use getAllByText
        const priceElements = screen.getAllByText('RM 150.00');
        expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders total amount', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ total_amount: 240 })} />);
        expect(screen.getByText('RM 240.00')).toBeInTheDocument();
    });

    it('renders payment status', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('PAID')).toBeInTheDocument();
    });

    it('renders payment method', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration()} />);
        expect(screen.getByText('FPX')).toBeInTheDocument();
    });

    // --- Single attendee: "Attendee Information" title ---

    it('renders "Attendee Information" for single attendee', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ quantity: 1 })} />);
        expect(screen.getByText('Attendee Information')).toBeInTheDocument();
    });

    // --- Multi-attendee: shows "Attendee 1 (Primary Buyer)" and additional attendees ---

    it('renders "Attendee 1 (Primary Buyer)" when quantity > 1', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ quantity: 3 })} />);
        expect(screen.getByText('Attendee 1 (Primary Buyer)')).toBeInTheDocument();
    });

    it('renders additional attendees from meta_json', () => {
        render(
            <RegistrationShow
                event={makeEvent()}
                registration={makeRegistration({
                    quantity: 3,
                    meta_json: {
                        attendees: [
                            {
                                name: 'Siti binti Yusof',
                                email: 'siti@example.com',
                                phone: '+60199887766',
                                company: 'ABC Sdn Bhd',
                                job_title: 'Engineer',
                                dietary_requirements: 'Vegetarian',
                            },
                            {
                                name: 'Ahmad bin Razak',
                                email: 'ahmad@example.com',
                                phone: null,
                                company: null,
                                job_title: null,
                                dietary_requirements: null,
                            },
                        ],
                    },
                })}
            />
        );
        // Primary attendee
        expect(screen.getByText('Ali bin Ahmad')).toBeInTheDocument();
        // Additional attendees
        expect(screen.getByText('Attendee 2')).toBeInTheDocument();
        expect(screen.getByText('Siti binti Yusof')).toBeInTheDocument();
        expect(screen.getByText('siti@example.com')).toBeInTheDocument();
        expect(screen.getByText('+60199887766')).toBeInTheDocument();
        expect(screen.getByText('ABC Sdn Bhd')).toBeInTheDocument();
        expect(screen.getByText('Engineer')).toBeInTheDocument();
        expect(screen.getByText('Vegetarian')).toBeInTheDocument();

        expect(screen.getByText('Attendee 3')).toBeInTheDocument();
        expect(screen.getByText('Ahmad bin Razak')).toBeInTheDocument();
        expect(screen.getByText('ahmad@example.com')).toBeInTheDocument();
    });

    it('does not render additional attendee cards when quantity is 1', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ quantity: 1 })} />);
        expect(screen.queryByText('Attendee 2')).not.toBeInTheDocument();
    });

    // --- Action buttons ---

    it('shows Approve button for pending registrations', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ status: 'pending' })} />);
        expect(screen.getByText('Approve Registration')).toBeInTheDocument();
    });

    it('shows Check In button for confirmed registrations', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ status: 'confirmed' })} />);
        expect(screen.getByText('Check In')).toBeInTheDocument();
    });

    it('shows Cancel button for confirmed registrations', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ status: 'confirmed' })} />);
        expect(screen.getByText('Cancel Registration')).toBeInTheDocument();
    });

    it('shows Reinstate button for cancelled registrations', () => {
        render(<RegistrationShow event={makeEvent()} registration={makeRegistration({ status: 'cancelled' })} />);
        expect(screen.getByText('Reinstate')).toBeInTheDocument();
    });

    it('shows checked in time when present', () => {
        render(
            <RegistrationShow
                event={makeEvent()}
                registration={makeRegistration({
                    status: 'attended',
                    checked_in_at: '2026-02-27T10:30:00.000Z',
                })}
            />
        );
        expect(screen.getByText(/Checked In At/i)).toBeInTheDocument();
    });

    // --- Product line items ---

    it('renders product line items in order summary', () => {
        render(
            <RegistrationShow
                event={makeEvent()}
                registration={makeRegistration({
                    products_total: 90,
                    total_amount: 240,
                    products: [
                        {
                            id: 1,
                            registration_id: 1,
                            product_id: 1,
                            product: {
                                id: 1,
                                event_id: 1,
                                name: 'Tshirt',
                                description: null,
                                price: 90,
                                currency: 'MYR',
                                variants_json: null,
                                stock: null,
                                media_id: null,
                                media: null,
                                is_active: true,
                                sort_order: 0,
                                created_at: '2026-01-01T00:00:00Z',
                                updated_at: '2026-01-01T00:00:00Z',
                            },
                            variant: 'M',
                            quantity: 1,
                            unit_price: 90,
                            created_at: '2026-02-27T00:00:00Z',
                            updated_at: '2026-02-27T00:00:00Z',
                        },
                    ],
                })}
            />
        );
        expect(screen.getByText('Tshirt')).toBeInTheDocument();
        expect(screen.getByText('(M)')).toBeInTheDocument();
    });
});
