import { Link } from '@inertiajs/react';
import { MessageSquare, ChevronRight, Circle } from 'lucide-react';
import { type Conversation } from '@/types';

interface Props {
    conversation: Conversation;
    currentUserId?: number;
}

export default function ConversationCard({ conversation, currentUserId }: Props) {
    const lastMsg = conversation.latest_message;
    const isOwnLast = lastMsg && currentUserId && lastMsg.sender_id === currentUserId;
    const previewLabel = lastMsg
        ? isOwnLast
            ? 'You: '
            : (lastMsg.sender?.name ? lastMsg.sender.name.split(' ')[0] + ': ' : '')
        : '';
    const hasUnread = (conversation.unread_count ?? 0) > 0;

    return (
        <Link
            href={`/dashboard/messages/${conversation.id}`}
            className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border transition-colors ${
                hasUnread
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-950/40'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800/40'
            }`}
        >
            <div className="flex-shrink-0 relative">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${hasUnread ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${hasUnread ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {hasUnread && (
                            <Circle className="w-2 h-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                        )}
                        <h4 className={`text-[13px] sm:text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-foreground'}`}>
                            {conversation.subject}
                        </h4>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {conversation.status === 'closed' && (
                            <span className="text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                Closed
                            </span>
                        )}
                        {hasUnread ? (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold px-1">
                                {conversation.unread_count}
                            </span>
                        ) : conversation.last_message_at && (
                            <span className="text-[10px] text-gray-300 dark:text-gray-600 flex-shrink-0 hidden sm:block">
                                {new Date(conversation.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>

                {lastMsg && (
                    <p className={`text-[11px] sm:text-xs mt-0.5 line-clamp-1 ${hasUnread ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span className={hasUnread ? '' : 'text-gray-400 dark:text-gray-500'}>{previewLabel}</span>
                        {lastMsg.body}
                    </p>
                )}

                {conversation.event && (
                    <p className="text-[9px] sm:text-[10px] text-blue-500/60 dark:text-blue-400/60 mt-1 truncate">
                        Re: {conversation.event.title}
                    </p>
                )}
            </div>

            <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-1 ${hasUnread ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} />
        </Link>
    );
}
