import { type Post } from '@/types';

interface Props {
    post: Post;
    onClick?: () => void;
}

const IS_VIDEO_TYPE = (type: string) => type === 'webinar' || type === 'agent360';

const TYPE_BADGE: Record<string, string> = {
    podcast: 'bg-purple-100 text-purple-800',
    webinar: 'bg-blue-100 text-blue-800',
    article: 'bg-orange-100 text-orange-800',
};

const TYPE_ICON = {
    podcast: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    ),
    webinar: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    article: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    agent360: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
};

export default function PostCard({ post, onClick }: Props) {
    const isVideo = IS_VIDEO_TYPE(post.type) && !!post.embed_url;
    return (
        <div
            className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200 ${isVideo ? 'cursor-pointer' : ''}`}
            onClick={isVideo ? onClick : undefined}
            role={isVideo ? 'button' : undefined}
            tabIndex={isVideo ? 0 : undefined}
            onKeyDown={isVideo ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
        >
            {/* Image */}
            <div className="aspect-video bg-gray-100 overflow-hidden flex-shrink-0 relative group">
                {post.media ? (
                    <img
                        src={post.media.url}
                        alt={post.media.alt ?? post.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        {TYPE_ICON[post.type]}
                    </div>
                )}

                {/* Play button overlay for video types */}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-brand-navy ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${TYPE_BADGE[post.type]}`}>
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                </span>

                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{post.title}</h3>

                {post.excerpt && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}

                {post.published_at && (
                    <p className="mt-2 text-xs text-gray-400">
                        {new Date(post.published_at).toLocaleDateString('en-MY', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}
