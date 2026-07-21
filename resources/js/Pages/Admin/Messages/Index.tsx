import { Head, Link } from '@inertiajs/react';
import { MessageSquare, ChevronRight, CheckCheck, Circle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { type Conversation } from '@/types';

interface Props {
    conversations: Conversation[];
}

export default function Index({ conversations }: Props) {
    const openConversations = conversations.filter((c) => c.status === 'open');
    const closedConversations = conversations.filter((c) => c.status === 'closed');

    return (
        <AdminLayout>
            <Head title="Messages" />

            <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Messages</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                        Respond to user inquiries
                    </p>
                </div>
                {(openConversations.length > 0) && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {openConversations.length} open
                    </span>
                )}
            </div>

            {conversations.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">No messages yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        User messages will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    {openConversations.length > 0 && (
                        <section>
                            <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">
                                Open ({openConversations.length})
                            </h2>
                            <div className="border border-border rounded-xl overflow-hidden">
                                {openConversations.map((conversation, i) => (
                                    <ConversationRow
                                        key={conversation.id}
                                        conversation={conversation}
                                        last={i === openConversations.length - 1}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {closedConversations.length > 0 && (
                        <section>
                            <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">
                                Closed ({closedConversations.length})
                            </h2>
                            <div className="border border-border rounded-xl overflow-hidden opacity-75">
                                {closedConversations.map((conversation, i) => (
                                    <ConversationRow
                                        key={conversation.id}
                                        conversation={conversation}
                                        last={i === closedConversations.length - 1}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}

function ConversationRow({ conversation, last }: { conversation: Conversation; last: boolean }) {
    const hasUnread = (conversation.unread_count ?? 0) > 0;

    return (
        <Link
            href={`/admin/messages/${conversation.id}`}
            className={`flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-muted/50 active:bg-muted transition-colors ${
                hasUnread
                    ? 'bg-blue-50/70 dark:bg-blue-950/20'
                    : 'bg-background'
            } ${!last ? 'border-b border-border' : ''}`}
        >
            <div className="flex-shrink-0 relative">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${hasUnread ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {conversation.user?.name ? (
                        <span className={`text-[11px] sm:text-xs font-bold ${hasUnread ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {conversation.user.name.charAt(0).toUpperCase()}
                        </span>
                    ) : (
                        <MessageSquare className={`w-4 h-4 sm:w-5 sm:h-5 ${hasUnread ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    {hasUnread && (
                        <Circle className="w-2 h-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                    )}
                    <h4 className={`text-[13px] sm:text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-foreground'}`}>
                        {conversation.subject}
                    </h4>
                    {hasUnread && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] sm:w-5 sm:h-5 rounded-full bg-blue-500 text-white text-[9px] sm:text-[10px] font-bold flex-shrink-0 px-1">
                            {conversation.unread_count}
                        </span>
                    )}
                    {!hasUnread && (
                        <CheckCheck className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 mt-0.5">
                    <p className={`text-[11px] sm:text-xs font-medium ${hasUnread ? 'text-gray-700 dark:text-gray-200' : 'text-muted-foreground'}`}>
                        {conversation.user?.name ?? 'Unknown'}
                    </p>
                    {conversation.latest_message && (
                        <p className={`text-[11px] sm:text-xs truncate hidden sm:block ${hasUnread ? 'text-gray-600 dark:text-gray-300' : 'text-muted-foreground/50'}`}>
                            {conversation.latest_message.body}
                        </p>
                    )}
                </div>
                {conversation.event && (
                    <p className="text-[9px] sm:text-[10px] text-blue-500/60 dark:text-blue-400/60 mt-0.5 truncate">
                        Re: {conversation.event.title}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {conversation.last_message_at && (
                    <span className="text-[10px] text-muted-foreground/40 hidden sm:block">
                        {new Date(conversation.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
            </div>
        </Link>
    );
}
