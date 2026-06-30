import { Facebook, Linkedin, MessageCircle, Share2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
    url: string;
    title: string;
}

const channels = [
    {
        label: 'Facebook',
        href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        icon: Facebook,
        iconColor: 'text-blue-600',
    },
    {
        label: 'WhatsApp',
        href: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}`,
        icon: MessageCircle,
        iconColor: 'text-green-600',
    },
    {
        label: 'X / Twitter',
        href: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
        icon: Share2,
        iconColor: 'text-gray-700',
    },
    {
        label: 'LinkedIn',
        href: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        icon: Linkedin,
        iconColor: 'text-sky-700',
    },
];

export default function ShareButtons({ url, title }: Props) {
    const encodedUrl   = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const [showFallback, setShowFallback] = useState(false);

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User dismissed
            }
        } else {
            setShowFallback(prev => !prev);
        }
    };

    const btnBase = 'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted hover:border-gray-300 dark:hover:border-border transition-colors';

    return (
        <>
            {/* Mobile: single share button with native OS sheet */}
            <div className="sm:hidden">
                <button
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-muted-foreground bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-muted/70 active:scale-95 px-4 py-2 rounded-full transition-all"
                >
                    <Share2 className="w-4 h-4" />
                    Share
                </button>
                {showFallback && (
                    <div className="flex items-center gap-2 mt-2">
                        {channels.map(({ label, href, icon: Icon, iconColor }) => (
                            <a
                                key={label}
                                href={href(encodedUrl, encodedTitle)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-muted hover:border-gray-300 dark:hover:border-border transition-colors`}
                            >
                                <Icon className={`w-4 h-4 ${iconColor}`} />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Desktop: consistent pill buttons */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {channels.map(({ label, href, icon: Icon, iconColor }) => (
                    <a
                        key={label}
                        href={href(encodedUrl, encodedTitle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnBase}
                    >
                        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                        {label}
                    </a>
                ))}
            </div>
        </>
    );
}
