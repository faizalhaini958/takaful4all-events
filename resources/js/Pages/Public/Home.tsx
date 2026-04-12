import PublicLayout from '@/Layouts/PublicLayout';
import EventCard from '@/Components/EventCard';
import PostCard from '@/Components/PostCard';
import VideoModal from '@/Components/VideoModal';
import SectionHeader from '@/Components/SectionHeader';
import HeroCarousel from '@/Components/HeroCarousel';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { BookOpen, Users, Lightbulb } from 'lucide-react';
import { type Banner, type Event, type Page, type Post } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

interface Props {
    banners: Banner[];
    upcomingEvents: Event[];
    pastEvents: Event[];
    aboutPage: Page | null;
    podcasts: Post[];
    webinars: Post[];
    agent360: Post[];
}

export default function Home({ banners, upcomingEvents, pastEvents, aboutPage, podcasts, webinars, agent360 }: Props) {
    const [activePost, setActivePost] = useState<Post | null>(null);
    const { t } = useTranslation();
    return (
        <PublicLayout>
            <VideoModal post={activePost} onClose={() => setActivePost(null)} />

            {/* ── Hero: Carousel if banners exist, otherwise static hero ── */}
            {banners.length > 0 ? (
                <HeroCarousel banners={banners} />
            ) : (
            <section className="relative bg-brand-light overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pb-40 md:py-32 md:pb-48">
                    <div className="max-w-3xl">
                        <p className="text-brand text-sm font-semibold uppercase tracking-wider mb-3">
                            Malaysian Takaful Association
                        </p>
                        <p className="text-brand text-2xl sm:text-3xl italic mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                            {t('home.hero_subtitle')}
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-navy leading-tight mb-8">
                            {t('home.hero_title')}
                        </h1>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/events"
                                className="bg-brand text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-dark transition-colors"
                            >
                                {t('home.view_all_events')}
                            </Link>
                            <Link
                                href="/about"
                                className="border-2 border-brand text-brand font-semibold px-6 py-3 rounded-lg hover:bg-brand hover:text-white transition-colors"
                            >
                                {t('home.about_mta')}
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Layered wave divider — matches original site */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-24 md:h-32">
                        <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#dff5f9" />
                        <path d="M0,75 C200,40 500,100 800,65 C1100,30 1300,90 1440,70 L1440,120 L0,120 Z" fill="#edfafc" />
                        <path d="M0,90 C300,70 600,110 900,85 C1150,65 1300,100 1440,88 L1440,120 L0,120 Z" fill="#f6fdfe" />
                        <path d="M0,105 C400,90 800,118 1200,100 C1320,94 1400,108 1440,105 L1440,120 L0,120 Z" fill="white" />
                    </svg>
                </div>
            </section>
            )}

            {/* ── Upcoming Events ── */}
            {upcomingEvents.length > 0 && (
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-8">
                        <SectionHeader
                            title={t('home.upcoming_events')}
                            subtitle={t('home.page_title')}
                        />
                        <Link href="/events?status=upcoming" className="text-sm font-medium text-brand hover:underline hidden sm:block">
                            {t('home.view_all')}
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Previous Events ── */}
            {pastEvents.length > 0 && (
                <section className="py-16 bg-brand-light/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-end justify-between mb-8">
                            <SectionHeader
                                title={t('home.previous_events')}
                                subtitle={t('home.previous_events_desc')}
                            />
                            <Link href="/events?status=past" className="text-sm font-medium text-brand hover:underline hidden sm:block">
                                {t('home.view_all')}
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {pastEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── About Section ── */}
            {aboutPage && (
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <SectionHeader title={t('home.about_mta')} />
                            <div
                                className="mt-4 prose prose-brand max-w-none text-gray-600 text-justify
                                           prose-p:mb-4 prose-p:leading-relaxed
                                           prose-strong:text-brand-navy prose-strong:font-semibold
                                           prose-h2:hidden prose-h3:hidden"
                                dangerouslySetInnerHTML={{ __html: aboutPage.content_html ?? '' }}
                            />
                            <Link
                                href="/about"
                                className="mt-6 inline-block text-sm font-semibold text-brand hover:underline"
                            >
                                {t('home.read_more_mta')}
                            </Link>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-md aspect-[4/3] lg:aspect-auto lg:h-full min-h-64">
                            <img
                                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"
                                alt={t('home.about_image_alt')}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ── Our Aims ── */}
            <section className="py-16 bg-brand-navy text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader title={t('home.our_aims')} subtitle={t('home.our_aims_desc')} centered />
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                Icon: BookOpen,
                                title: t('home.aim_knowledge'),
                                desc: t('home.aim_knowledge_desc'),
                            },
                            {
                                Icon: Users,
                                title: t('home.aim_networking'),
                                desc: t('home.aim_networking_desc'),
                            },
                            {
                                Icon: Lightbulb,
                                title: t('home.aim_leadership'),
                                desc: t('home.aim_leadership_desc'),
                            },
                        ].map(({ Icon, title, desc }) => (
                            <div
                                key={title}
                                className="bg-white/10 rounded-xl p-6 text-center hover:bg-white/15 transition-colors"
                            >
                                <div className="flex justify-center mb-4">
                                    <Icon className="w-10 h-10 text-brand-light" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{title}</h3>
                                <p className="text-brand-light/70 text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Podcasts ── */}
            {podcasts.length > 0 && (
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader title={t('home.podcasts')} subtitle={t('home.podcasts_desc')} />
                    <div className="mt-8 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                        {podcasts.map(post => (
                            <div key={post.id} className="flex-shrink-0 w-72 snap-start">
                                <PostCard post={post} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Webinars ── */}
            {webinars.length > 0 && (
                <section className="py-16 bg-brand-light/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <SectionHeader title={t('home.webinars')} subtitle={t('home.webinars_desc')} />
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {webinars.map(post => (
                                <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} />
                            ))}
                        </div>
                        <div className="mt-10 flex justify-center">
                            <Link
                                href="/webinars"
                                className="px-8 py-3 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                            >
                                {t('home.explore_more')}
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Agent360 Webinars ── */}
            {agent360.length > 0 && (
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader title={t('home.agent360_webinars')} subtitle={t('home.agent360_desc')} />
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agent360.map(post => (
                            <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} />
                        ))}
                    </div>
                    <div className="mt-10 flex justify-center">
                        <Link
                            href="/agent360"
                            className="px-8 py-3 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                        >
                            {t('home.explore_more')}
                        </Link>
                    </div>
                </section>
            )}
        </PublicLayout>
    );
}
