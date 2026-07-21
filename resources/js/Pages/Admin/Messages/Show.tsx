import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Send, CheckCircle2, ArrowDown } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import MessageBubble from '@/Components/MessageBubble';
import { type Conversation, type Message } from '@/types';

interface Props {
    conversation: Conversation;
    messages: Message[];
}

function formatDateLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]): { label: string; messages: Message[] }[] {
    const groups: { label: string; messages: Message[] }[] = [];
    let currentLabel = '';
    let currentGroup: Message[] = [];

    for (const msg of messages) {
        const label = formatDateLabel(msg.created_at);
        if (label !== currentLabel) {
            if (currentGroup.length > 0) groups.push({ label: currentLabel, messages: currentGroup });
            currentLabel = label;
            currentGroup = [msg];
        } else {
            currentGroup.push(msg);
        }
    }
    if (currentGroup.length > 0) groups.push({ label: currentLabel, messages: currentGroup });

    return groups;
}

const MAX_CHARS = 5000;

export default function Show({ conversation, messages: initialMessages }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { data, setData, post, reset, processing } = useForm({ body: '' });
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [convStatus, setConvStatus] = useState(conversation.status);

    const scrollToBottom = useCallback((smooth = false) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior,
            });
        }
    }, []);

    const checkNearBottom = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setIsNearBottom(scrollHeight - scrollTop - clientHeight < 120);
    }, []);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/admin/messages/${conversation.id}/poll`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            setMessages(data.messages);
            setConvStatus(data.status);
        } catch {
            // silent
        }
    }, [conversation.id]);

    useEffect(() => {
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, []);

    useEffect(() => {
        if (isNearBottom) {
            scrollToBottom(true);
        }
    }, [messages, isNearBottom, scrollToBottom]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkNearBottom, { passive: true });
        return () => el.removeEventListener('scroll', checkNearBottom);
    }, [checkNearBottom]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.body.trim() || data.body.length > MAX_CHARS) return;
        post(`/admin/messages/${conversation.id}/reply`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                fetchMessages();
                textareaRef.current?.focus();
            },
        });
    };

    const handleClose = () => {
        router.patch(`/admin/messages/${conversation.id}/close`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                window.location.reload();
            },
        });
    };

    const messageGroups = groupMessagesByDate(messages);
    const remaining = MAX_CHARS - data.body.length;
    const showFab = !isNearBottom;

    return (
        <AdminLayout>
            <Head title={conversation.subject} />

            <div className="flex flex-col h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-8rem)] -mx-4 sm:mx-0">
                <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-0 mb-2 sm:mb-4 flex-shrink-0">
                    <Link
                        href="/admin/messages"
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                            {conversation.subject}
                        </h1>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span className="font-medium truncate max-w-[100px] sm:max-w-none">
                                {conversation.user?.name ?? 'Unknown'}
                            </span>
                            <span className="hidden sm:inline">&middot;</span>
                            <span className="hidden sm:inline truncate max-w-[140px]">
                                {conversation.user?.email ?? ''}
                            </span>
                            {conversation.event && (
                                <>
                                    <span className="hidden sm:inline">&middot;</span>
                                    <Link
                                        href={`/admin/events/${conversation.event.slug}/edit`}
                                        className="text-brand hover:underline truncate max-w-[120px] sm:max-w-none"
                                    >
                                        {conversation.event.title}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {convStatus === 'open' ? (
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-border hover:bg-muted active:bg-muted/80 transition-colors"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Close</span>
                        </button>
                    ) : (
                        <span className="flex-shrink-0 text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-lg bg-muted text-muted-foreground">
                            Closed
                        </span>
                    )}
                </div>

                <div className="relative flex-1 overflow-hidden">
                    <div
                        ref={scrollRef}
                        className="absolute inset-0 overflow-y-auto px-4 sm:px-1 py-1 sm:py-2"
                    >
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                                        <ArrowDown className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">
                                        No messages yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Reply to the user to start the conversation.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messageGroups.map((group, gi) => (
                                <div key={gi}>
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0 px-1">
                                            {group.label}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    {group.messages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isOwn={msg.sender_id !== conversation.user_id}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {showFab && messages.length > 0 && (
                        <button
                            onClick={() => scrollToBottom(true)}
                            className="absolute bottom-2 right-2 sm:right-4 z-10 p-2 rounded-full bg-background border border-border shadow-lg hover:shadow-xl transition-all"
                        >
                            <ArrowDown className="w-4 h-4 text-foreground" />
                        </button>
                    )}
                </div>

                {convStatus === 'open' && (
                    <form
                        onSubmit={handleSubmit}
                        className="flex-shrink-0 px-4 sm:px-0 pt-2 sm:pt-3 pb-1 sm:pb-0 border-t border-border bg-background"
                    >
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 min-h-[42px] sm:min-h-[44px] max-h-28 sm:max-h-32 resize-none rounded-xl border border-border bg-muted/50 px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={processing || !data.body.trim() || data.body.length > MAX_CHARS}
                                className="flex-shrink-0 p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        {data.body.length > 20 && (
                            <p className={`text-[10px] mt-1.5 px-1 ${remaining < 50 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                                {remaining} characters remaining
                            </p>
                        )}
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
