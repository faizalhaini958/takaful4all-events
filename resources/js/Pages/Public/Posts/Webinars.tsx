import PublicLayout from '@/Layouts/PublicLayout';
import PostCard from '@/Components/PostCard';
import VideoModal from '@/Components/VideoModal';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Video } from 'lucide-react';
import { type Post, type PaginatedData } from '@/types';

interface Props {
    webinars: PaginatedData<Post>;
}

export default function WebinarsIndex({ webinars }: Props) {
    const [activePost, setActivePost] = useState<Post | null>(null);

    return (
        <PublicLayout>
            <VideoModal post={activePost} onClose={() => setActivePost(null)} />
            {/* ── Hero ── */}
            <section className="relative bg-brand-light overflow-hidden">
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-36 md:py-20 md:pb-44">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy uppercase tracking-wide mb-3">
                        Webinars
                    </h1>
                    <p className="text-brand-navy/60 text-lg">
                        On-demand webinars from leading takaful experts.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                    <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-24 md:h-32">
                        <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" fill="#dff5f9" />
                        <path d="M0,75 C200,40 500,100 800,65 C1100,30 1300,90 1440,70 L1440,120 L0,120 Z" fill="#edfafc" />
                        <path d="M0,90 C300,70 600,110 900,85 C1150,65 1300,100 1440,88 L1440,120 L0,120 Z" fill="#f6fdfe" />
                        <path d="M0,105 C400,90 800,118 1200,100 C1320,94 1400,108 1440,105 L1440,120 L0,120 Z" fill="white" />
                    </svg>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {webinars.data.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {webinars.data.map(post => (
                            <PostCard key={post.id} post={post} onClick={() => setActivePost(post)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 text-gray-400 flex flex-col items-center gap-4">
                        <Video className="w-12 h-12 text-brand/30" strokeWidth={1.5} />
                        <p className="text-lg font-medium text-gray-500">No webinars found.</p>
                    </div>
                )}

                {/* Pagination */}
                {webinars.last_page > 1 && (
                    <div className="mt-10 flex justify-center gap-1 flex-wrap">
                        {webinars.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                    link.active
                                        ? 'bg-brand text-white border-brand'
                                        : link.url
                                            ? 'bg-white border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
                                            : 'bg-white border-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
