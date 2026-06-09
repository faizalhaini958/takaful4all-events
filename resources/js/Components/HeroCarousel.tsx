import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Banner, type ContentBanner } from '@/types';

interface Props {
    banners: Banner[] | ContentBanner[];
    overlay?: ReactNode;
    contained?: boolean;
}

export default function HeroCarousel({ banners, overlay, contained }: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
    const scrollTo   = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
        emblaApi.on('select', onSelect);
        onSelect();

        // Auto-advance every 6 seconds
        const interval = setInterval(() => emblaApi.scrollNext(), 6000);

        return () => {
            emblaApi.off('select', onSelect);
            clearInterval(interval);
        };
    }, [emblaApi]);

    if (banners.length === 0) return null;

    const inner = (
        <div className="relative">
            {/* Top gradient scrim */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />
            {/* Dots — bottom centre */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                    {banners.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            className={`rounded-full transition-all ${
                                i === selectedIndex
                                    ? 'bg-white w-5 h-2'
                                    : 'bg-white/50 hover:bg-white/70 w-2 h-2'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {banners.map((banner, i) => {
                        const Wrapper = banner.link_url ? 'a' : 'div';
                        const wrapperProps = banner.link_url
                            ? { href: banner.link_url, target: '_blank', rel: 'noopener noreferrer' }
                            : {};

                        return (
                            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                                <Wrapper {...wrapperProps} className="block">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        className="hidden md:block w-full object-cover"
                                        style={{ aspectRatio: '16 / 6' }}
                                    />
                                    <img
                                        src={banner.mobile_image_url ?? banner.image_url}
                                        alt={banner.title}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        className="block md:hidden w-full object-cover"
                                        style={{ aspectRatio: banner.mobile_image_url ? '3 / 4' : '16 / 9' }}
                                    />
                                </Wrapper>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white border border-white/30 rounded-full p-2.5 transition-all"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white border border-white/30 rounded-full p-2.5 transition-all"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );

    if (contained) return inner;

    return (
        <section className="w-full bg-brand-light -mt-16">
            {inner}
        </section>
    );
}
