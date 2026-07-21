import { Link, Head, usePage } from '@inertiajs/react';
import { Plus, MessageSquare } from 'lucide-react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import ConversationCard from '@/Components/ConversationCard';
import { type Conversation, type PageProps } from '@/types';

interface Props {
    conversations: Conversation[];
}

export default function Index({ conversations }: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentUserId = auth.user?.id;

    const openConversations = conversations.filter((c) => c.status === 'open');
    const closedConversations = conversations.filter((c) => c.status === 'closed');

    return (
        <UserDashboardLayout title="Messages">
            <Head title="Messages" />

            <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Messages</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                        Ask us anything about events or your registrations
                    </p>
                </div>
                <Link
                    href="/dashboard/messages/create"
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Message</span>
                    <span className="sm:hidden">New</span>
                </Link>
            </div>

            {conversations.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-brand" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">No messages yet</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-xs mx-auto px-4">
                        Start a conversation and we'll get back to you shortly.
                    </p>
                    <Link
                        href="/dashboard/messages/create"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Send a message
                    </Link>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    {openConversations.length > 0 && (
                        <section>
                            <h2 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 sm:mb-3">
                                Open ({openConversations.length})
                            </h2>
                            <div className="space-y-1.5 sm:space-y-2">
                                {openConversations.map((conversation) => (
                                    <ConversationCard
                                        key={conversation.id}
                                        conversation={conversation}
                                        currentUserId={currentUserId}
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
                            <div className="space-y-1.5 sm:space-y-2">
                                {closedConversations.map((conversation) => (
                                    <ConversationCard
                                        key={conversation.id}
                                        conversation={conversation}
                                        currentUserId={currentUserId}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </UserDashboardLayout>
    );
}
