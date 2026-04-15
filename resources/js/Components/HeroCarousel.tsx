import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Banner } from '@/types';

interface Props {
    banners: Banner[];
}

export default function HeroCarousel({ banners }: Props) {
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

    return (
        <section className="w-full bg-brand-light py-8 sm:py-12">
            <div className="max-w-[1250px] mx-auto px-4 sm:px-6">
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {banners.map((banner) => {
                                const Wrapper = banner.link_url ? 'a' : 'div';
                                const wrapperProps = banner.link_url
                                    ? { href: banner.link_url, target: '_blank', rel: 'noopener noreferrer' }
                                    : {};

                                return (
                                    <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative">
                                        <Wrapper {...wrapperProps} className="block">
                                            {/* Desktop image */}
                                            <img
                                                src={banner.image_url}
                                                alt={banner.title}
                                                className="hidden md:block w-full object-cover"
                                                style={{ aspectRatio: '1250 / 430' }}
                                            />
                                            {/* Mobile image: use mobile_image_url if available, otherwise fallback to desktop */}
                                            <img
                                                src={banner.mobile_image_url ?? banner.image_url}
                                                alt={banner.title}
                                                className="block md:hidden w-full object-cover"
                                                style={{ aspectRatio: '3 / 4' }}
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
                                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-brand-navy rounded-full p-2 shadow-lg transition-colors"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={scrollNext}
                                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-brand-navy rounded-full p-2 shadow-lg transition-colors"
                                aria-label="Next slide"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Dot indicators */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => scrollTo(i)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        i === selectedIndex
                                            ? 'bg-white scale-110'
                                            : 'bg-white/50 hover:bg-white/70'
                                    }`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
