import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from '@inertiajs/react';
import EventRegister from '@/Pages/Public/Events/Register';
import { type Event, type EventTicket, type EventProduct } from '@/types';

// Mock the PublicLayout to just render children
vi.mock('@/Layouts/PublicLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="public-layout">{children}</div>,
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
        venue: 'KLCC Convention Centre',
        city: 'Kuala Lumpur',
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

function makeTicket(overrides: Partial<EventTicket> = {}): EventTicket {
    return {
        id: 1,
        event_id: 1,
        name: 'Early Bird',
        description: 'Discounted early bird ticket',
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
        ...overrides,
    };
}

function makeProduct(overrides: Partial<EventProduct> = {}): EventProduct {
    return {
        id: 1,
        event_id: 1,
        name: 'Tshirt',
        description: 'Official event t-shirt',
        price: 90,
        currency: 'MYR',
        variants_json: [{ label: 'Size', options: ['S', 'M', 'L', 'XL'] }],
        stock: 50,
        media_id: null,
        media: null,
        is_active: true,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('EventRegister Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders event title in hero section', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Tech Summit 2026')).toBeInTheDocument();
    });

    it('renders event date', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText(/December/i)).toBeInTheDocument();
    });

    it('renders venue and location', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText(/KLCC Convention Centre/)).toBeInTheDocument();
    });

    it('renders Back to event link', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        const link = screen.getByText(/Back to event/);
        expect(link.closest('a')).toHaveAttribute('href', '/events/tech-summit-2026');
    });

    it('renders Select Ticket section', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Select Ticket')).toBeInTheDocument();
    });

    it('renders ticket name and price', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
        expect(screen.getByText('RM 150.00')).toBeInTheDocument();
    });

    it('renders free ticket label', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket({ type: 'free', price: 0, name: 'Free Pass' })]}
                products={[]}
            />
        );
        expect(screen.getByText('Free Pass')).toBeInTheDocument();
        expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('renders ticket description', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Discounted early bird ticket')).toBeInTheDocument();
    });

    it('shows available spots count', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket({ available_count: 5 })]} products={[]} />);
        expect(screen.getByText('5 spots left')).toBeInTheDocument();
    });

    it('renders multiple tickets', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[
                    makeTicket({ id: 1, name: 'Early Bird', price: 150 }),
                    makeTicket({ id: 2, name: 'Regular', price: 250 }),
                    makeTicket({ id: 3, name: 'VIP', price: 500 }),
                ]}
                products={[]}
            />
        );
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
        expect(screen.getByText('Regular')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
    });

    it('shows no tickets message when no tickets are on sale', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket({ is_on_sale: false })]}
                products={[]}
            />
        );
        expect(screen.getByText('No tickets available at this time.')).toBeInTheDocument();
    });

    // --- Add-on Products section ---

    it('renders Add-on Products section when products exist', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        expect(screen.getByText('Add-on Products')).toBeInTheDocument();
    });

    it('does not render Add-on Products section when no products', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.queryByText('Add-on Products')).not.toBeInTheDocument();
    });

    it('renders product name and price', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        expect(screen.getByText('Tshirt')).toBeInTheDocument();
        expect(screen.getByText('RM 90.00')).toBeInTheDocument();
    });

    it('renders product description', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        expect(screen.getByText('Official event t-shirt')).toBeInTheDocument();
    });

    it('renders product image when media is provided', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct({
                    media: {
                        id: 1, disk: 'public', path: 'tshirt.jpg', url: '/storage/tshirt.jpg',
                        alt: 'Tshirt', title: 'Tshirt', mime: 'image/jpeg',
                        size: 512, width: 400, height: 400,
                        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
                    },
                })]}
            />
        );
        expect(screen.getByAltText('Tshirt')).toHaveAttribute('src', '/storage/tshirt.jpg');
    });

    it('shows "Add to order" button for each product', () => {
        render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        expect(screen.getByText('Add to order')).toBeInTheDocument();
    });

    // --- Attendee Details ---

    it('renders single attendee form with "Your Details" title', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Your Details')).toBeInTheDocument();
    });

    it('renders attendee form fields', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
        expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone')).toBeInTheDocument();
        expect(screen.getByLabelText('Company / Organisation')).toBeInTheDocument();
        expect(screen.getByLabelText('Job Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Dietary Requirements')).toBeInTheDocument();
    });

    it('renders Additional Notes field', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByLabelText('Additional Notes')).toBeInTheDocument();
    });

    // --- Order Summary ---

    it('renders order summary section', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    it('shows "Select a ticket" prompt when no ticket selected', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        expect(screen.getByText('Select a ticket to see your order summary.')).toBeInTheDocument();
    });

    it('renders Register button', () => {
        render(<EventRegister event={makeEvent()} tickets={[makeTicket()]} products={[]} />);
        const button = screen.getByRole('button', { name: /Register/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled(); // disabled until ticket selected
    });

    // --- Layout order: Add-on Products appears before Attendee Details ---

    it('renders Add-on Products before Attendee Details in DOM order', () => {
        const { container } = render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        const allText = container.textContent ?? '';
        const productsIdx = allText.indexOf('Add-on Products');
        const detailsIdx = allText.indexOf('Your Details');
        expect(productsIdx).toBeLessThan(detailsIdx);
    });

    it('renders Add-on Products after Select Ticket in DOM order', () => {
        const { container } = render(
            <EventRegister
                event={makeEvent()}
                tickets={[makeTicket()]}
                products={[makeProduct()]}
            />
        );
        const allText = container.textContent ?? '';
        const ticketIdx = allText.indexOf('Select Ticket');
        const productsIdx = allText.indexOf('Add-on Products');
        expect(ticketIdx).toBeLessThan(productsIdx);
    });
});
