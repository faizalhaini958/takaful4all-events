import { Facebook, Linkedin, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: Props) {
    const encodedUrl   = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const [showFallback, setShowFallback] = useState(false);

    const channels = [
        {
            label: 'Facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            icon: Facebook,
            classes: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        },
        {
            label: 'WhatsApp',
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            icon: MessageCircle,
            classes: 'bg-green-100 text-green-700 hover:bg-green-200',
        },
        {
            label: 'X / Twitter',
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            icon: Share2,
            classes: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        },
        {
            label: 'LinkedIn',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            icon: Linkedin,
            classes: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
        },
    ];

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User dismissed — do nothing
            }
        } else {
            setShowFallback(prev => !prev);
        }
    };

    return (
        <>
            {/* Mobile: single share button with native OS sheet */}
            <div className="sm:hidden">
                <button
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 px-4 py-2 rounded-full transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    Share this event
                </button>
                {/* Fallback icon row for browsers without Web Share API */}
                {showFallback && (
                    <div className="flex items-center gap-2 mt-2">
                        {channels.map(({ label, href, icon: Icon, classes }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${classes}`}
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop: full labeled buttons */}
            <div className="hidden sm:flex items-center gap-3 flex-wrap">
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium">Share this event:</span>
                {channels.map(({ label, href, icon: Icon, classes }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${classes}`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </a>
                ))}
            </div>
        </>
    );
}
