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
        <section className="relative w-full overflow-hidden bg-brand-navy">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                    {banners.map((banner) => (
                        <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative">
                            {banner.link_url ? (
                                <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                        src={banner.image_url}
                                        alt={banner.title}
                                        className="w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] object-cover"
                                    />
                                </a>
                            ) : (
                                <img
                                    src={banner.image_url}
                                    alt={banner.title}
                                    className="w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] object-cover"
                                />
                            )}
                            {/* Gradient overlay for text legibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            {/* Title */}
                            <div className="absolute bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8">
                                <div className="max-w-7xl mx-auto">
                                    <h2 className="text-white text-lg sm:text-2xl font-bold drop-shadow-lg">
                                        {banner.title}
                                    </h2>
                                </div>
                            </div>
                        </div>
                    ))}
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
        </section>
    );
}
