import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostCard from '@/Components/PostCard';
import { type Post } from '@/types';

function makePost(overrides: Partial<Post> = {}): Post {
    return {
        id: 1,
        type: 'article',
        title: 'Understanding Takaful',
        slug: 'understanding-takaful',
        excerpt: 'A brief guide to takaful insurance',
        content_html: '<p>Content here</p>',
        embed_url: null,
        media_id: null,
        media: null,
        is_published: true,
        published_at: '2026-02-15T10:00:00.000Z',
        meta_json: null,
        created_at: '2026-02-15T00:00:00.000Z',
        updated_at: '2026-02-15T00:00:00.000Z',
        ...overrides,
    };
}

describe('PostCard', () => {
    it('renders post title', () => {
        render(<PostCard post={makePost()} />);
        expect(screen.getByText('Understanding Takaful')).toBeInTheDocument();
    });

    it('renders post excerpt', () => {
        render(<PostCard post={makePost()} />);
        expect(screen.getByText('A brief guide to takaful insurance')).toBeInTheDocument();
    });

    it('does not render excerpt when null', () => {
        render(<PostCard post={makePost({ excerpt: null })} />);
        expect(screen.queryByText('A brief guide to takaful insurance')).not.toBeInTheDocument();
    });

    it('renders type badge capitalized', () => {
        render(<PostCard post={makePost({ type: 'article' })} />);
        expect(screen.getByText('Article')).toBeInTheDocument();
    });

    it('renders podcast badge', () => {
        render(<PostCard post={makePost({ type: 'podcast' })} />);
        expect(screen.getByText('Podcast')).toBeInTheDocument();
    });

    it('renders webinar badge', () => {
        render(<PostCard post={makePost({ type: 'webinar' })} />);
        expect(screen.getByText('Webinar')).toBeInTheDocument();
    });

    it('renders published date', () => {
        render(<PostCard post={makePost({ published_at: '2026-02-15T10:00:00.000Z' })} />);
        // en-MY format: "15 Feb 2026"
        expect(screen.getByText(/15 Feb/)).toBeInTheDocument();
    });

    it('does not render date when published_at is null', () => {
        render(<PostCard post={makePost({ published_at: null })} />);
        expect(screen.queryByText(/Feb/)).not.toBeInTheDocument();
    });

    it('renders featured image when media is provided', () => {
        render(<PostCard post={makePost({
            media: {
                id: 1,
                disk: 'public',
                path: 'posts/hero.jpg',
                url: '/storage/posts/hero.jpg',
                alt: 'Takaful Hero',
                title: 'Hero',
                mime: 'image/jpeg',
                size: 512,
                width: 800,
                height: 450,
                created_at: '2026-01-01T00:00:00Z',
                updated_at: '2026-01-01T00:00:00Z',
            },
        })} />);
        expect(screen.getByAltText('Takaful Hero')).toHaveAttribute('src', '/storage/posts/hero.jpg');
    });

    it('has button role for video types with embed_url', () => {
        const onClick = vi.fn();
        render(<PostCard post={makePost({ type: 'webinar', embed_url: 'https://youtube.com/xyz' })} onClick={onClick} />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not have button role for article type', () => {
        render(<PostCard post={makePost({ type: 'article' })} />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClick when video card is clicked', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<PostCard post={makePost({ type: 'webinar', embed_url: 'https://youtube.com/xyz' })} onClick={onClick} />);
        await user.click(screen.getByRole('button'));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick for non-video posts', async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        const { container } = render(<PostCard post={makePost({ type: 'article' })} onClick={onClick} />);
        await user.click(container.firstElementChild!);
        expect(onClick).not.toHaveBeenCalled();
    });
});
