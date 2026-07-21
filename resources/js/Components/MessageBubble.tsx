import { Check, CheckCheck } from 'lucide-react';
import { type Message } from '@/types';

interface Props {
    message: Message;
    isOwn: boolean;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn }: Props) {
    const time = formatTime(message.created_at);

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 group`}>
            <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 ${
                    isOwn
                        ? 'bg-brand text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-md'
                }`}
            >
                {!isOwn && message.sender && (
                    <p className="text-[11px] sm:text-xs font-semibold text-brand-navy dark:text-brand-light mb-1">
                        {message.sender.name}
                    </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
                <div className="flex items-center justify-end gap-1 mt-1 sm:mt-1.5">
                    <span
                        className={`text-[10px] ${
                            isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        {time}
                    </span>
                    {isOwn && (
                        message.is_read
                            ? <CheckCheck className="w-3.5 h-3.5 text-white/60" />
                            : <Check className="w-3.5 h-3.5 text-white/40" />
                    )}
                </div>
            </div>
        </div>
    );
}
