import { Facebook, Linkedin, MessageCircle, Share2 } from 'lucide-react';

interface Props {
    url: string;
    title: string;
}

export default function ShareButtons({ url, title }: Props) {
    const encodedUrl   = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

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

    return (
        <div className="flex items-center gap-3 flex-wrap">
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
    );
}
