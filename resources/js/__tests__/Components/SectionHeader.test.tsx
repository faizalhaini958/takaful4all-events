import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeader from '@/Components/SectionHeader';

describe('SectionHeader', () => {
    it('renders the title', () => {
        render(<SectionHeader title="Upcoming Events" />);
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<SectionHeader title="Events" subtitle="See what is coming up" />);
        expect(screen.getByText('See what is coming up')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
        const { container } = render(<SectionHeader title="Events" />);
        const paragraphs = container.querySelectorAll('p');
        expect(paragraphs).toHaveLength(0);
    });

    it('applies centered style when centered prop is true', () => {
        const { container } = render(<SectionHeader title="Events" centered />);
        expect(container.firstChild).toHaveClass('text-center');
    });

    it('does not apply centered style by default', () => {
        const { container } = render(<SectionHeader title="Events" />);
        expect(container.firstChild).not.toHaveClass('text-center');
    });
});
