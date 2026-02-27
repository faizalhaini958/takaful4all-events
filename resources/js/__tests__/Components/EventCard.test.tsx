import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventCard from '@/Components/EventCard';
import { type Event } from '@/types';

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: 1,
        title: 'Tech Summit 2026',
        slug: 'tech-summit-2026',
        excerpt: 'The biggest tech event of the year',
        content_html: '<p>Details here</p>',
        start_at: '2026-12-01T09:00:00.000Z',
        end_at: '2026-12-01T17:00:00.000Z',
        venue: 'KLCC Convention Centre',
        city: 'Kuala Lumpur',
        state: 'WP Kuala Lumpur',
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

describe('EventCard', () => {
    it('renders event title', () => {
        render(<EventCard event={makeEvent()} />);
        expect(screen.getByText('Tech Summit 2026')).toBeInTheDocument();
    });

    it('renders event excerpt', () => {
        render(<EventCard event={makeEvent()} />);
        expect(screen.getByText('The biggest tech event of the year')).toBeInTheDocument();
    });

    it('renders status badge', () => {
        render(<EventCard event={makeEvent({ status: 'upcoming' })} />);
        expect(screen.getByText('Upcoming')).toBeInTheDocument();
    });

    it('renders past status badge', () => {
        render(<EventCard event={makeEvent({ status: 'past' })} />);
        expect(screen.getByText('Past')).toBeInTheDocument();
    });

    it('renders venue when provided', () => {
        render(<EventCard event={makeEvent({ venue: 'KLCC Convention Centre' })} />);
        expect(screen.getByText('KLCC Convention Centre')).toBeInTheDocument();
    });

    it('renders city when venue is not provided', () => {
        render(<EventCard event={makeEvent({ venue: null, city: 'Kuala Lumpur' })} />);
        expect(screen.getByText('Kuala Lumpur')).toBeInTheDocument();
    });

    it('links to the event detail page', () => {
        render(<EventCard event={makeEvent()} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/events/tech-summit-2026');
    });

    it('renders featured image when media is provided', () => {
        render(<EventCard event={makeEvent({
            media: {
                id: 1,
                disk: 'public',
                path: 'events/hero.jpg',
                url: '/storage/events/hero.jpg',
                alt: 'Tech Summit Hero',
                title: 'Hero',
                mime: 'image/jpeg',
                size: 1024,
                width: 1920,
                height: 1080,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
            },
        })} />);
        const img = screen.getByAltText('Tech Summit Hero');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/storage/events/hero.jpg');
    });

    it('renders placeholder when no media is provided', () => {
        const { container } = render(<EventCard event={makeEvent({ media: null })} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders countdown for upcoming events', () => {
        // Use a date far in the future so countdown is non-null
        const futureDate = new Date(Date.now() + 10 * 86_400_000).toISOString();
        const { container } = render(
            <EventCard event={makeEvent({ status: 'upcoming', start_at: futureDate })} />
        );
        expect(container.textContent).toMatch(/days/);
    });

    it('does not render countdown for past events', () => {
        const pastDate = new Date(Date.now() - 86_400_000).toISOString();
        const { container } = render(
            <EventCard event={makeEvent({ status: 'past', start_at: pastDate })} />
        );
        expect(container.textContent).not.toMatch(/days/);
    });

    it('does not render excerpt when null', () => {
        render(<EventCard event={makeEvent({ excerpt: null })} />);
        expect(screen.queryByText('The biggest tech event of the year')).not.toBeInTheDocument();
    });
});
