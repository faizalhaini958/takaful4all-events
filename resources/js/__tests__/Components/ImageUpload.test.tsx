import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageUpload from '@/Components/ImageUpload';

describe('ImageUpload', () => {
    const defaultProps = {
        value: '',
        currentMedia: null,
        onChange: vi.fn(),
        onClear: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dropzone when no image is selected', () => {
        render(<ImageUpload {...defaultProps} />);
        expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
        expect(screen.getByText(/drag & drop/)).toBeInTheDocument();
    });

    it('shows file size hint', () => {
        render(<ImageUpload {...defaultProps} />);
        expect(screen.getByText(/max 5 MB/)).toBeInTheDocument();
    });

    it('shows file type hint', () => {
        render(<ImageUpload {...defaultProps} />);
        expect(screen.getByText(/PNG, JPG, WebP/)).toBeInTheDocument();
    });

    it('renders a hidden file input', () => {
        const { container } = render(<ImageUpload {...defaultProps} />);
        const input = container.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('hidden');
        expect(input).toHaveAttribute('accept', 'image/*');
    });

    it('renders image preview when currentMedia is provided', () => {
        render(
            <ImageUpload
                value="1"
                currentMedia={{
                    id: 1,
                    disk: 'public',
                    path: 'test.jpg',
                    url: '/storage/test.jpg',
                    alt: 'Test Image',
                    title: 'Test',
                    mime: 'image/jpeg',
                    size: 1024,
                    width: 800,
                    height: 600,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z',
                }}
                onChange={vi.fn()}
                onClear={vi.fn()}
            />
        );
        const img = screen.getByAltText('Featured');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/storage/test.jpg');
    });

    it('shows Change and Remove buttons on preview hover', () => {
        render(
            <ImageUpload
                value="1"
                currentMedia={{
                    id: 1,
                    disk: 'public',
                    path: 'test.jpg',
                    url: '/storage/test.jpg',
                    alt: null,
                    title: null,
                    mime: 'image/jpeg',
                    size: 1024,
                    width: 800,
                    height: 600,
                    created_at: '2026-01-01T00:00:00Z',
                    updated_at: '2026-01-01T00:00:00Z',
                }}
                onChange={vi.fn()}
                onClear={vi.fn()}
            />
        );
        expect(screen.getByText('Change')).toBeInTheDocument();
        expect(screen.getByText('Remove')).toBeInTheDocument();
    });
});
