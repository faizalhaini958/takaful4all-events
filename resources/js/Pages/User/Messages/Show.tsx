import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Send, ArrowDown } from 'lucide-react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
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
            const res = await fetch(`/dashboard/messages/${conversation.id}/poll`, {
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
        post(`/dashboard/messages/${conversation.id}/reply`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                fetchMessages();
                textareaRef.current?.focus();
            },
        });
    };

    const messageGroups = groupMessagesByDate(messages);
    const remaining = MAX_CHARS - data.body.length;
    const showFab = !isNearBottom;

    return (
        <UserDashboardLayout title={conversation.subject}>
            <Head title={conversation.subject} />

            <div className="flex flex-col h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-12rem)] -mx-3 sm:mx-0">
                <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-0 mb-2 sm:mb-4 flex-shrink-0">
                    <Link
                        href="/dashboard/messages"
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                            {conversation.subject}
                        </h1>
                        {conversation.event && (
                            <p className="text-[10px] sm:text-xs text-brand/70 truncate">
                                Re: {conversation.event.title}
                            </p>
                        )}
                    </div>
                    {convStatus === 'closed' && (
                        <span className="flex-shrink-0 text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                            Closed
                        </span>
                    )}
                </div>

                <div className="relative flex-1 overflow-hidden">
                    <div
                        ref={scrollRef}
                        className="absolute inset-0 overflow-y-auto px-3 sm:px-1 py-1 sm:py-2"
                    >
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                                        <ArrowDown className="w-7 h-7 text-brand" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground mb-1">
                                        Start the conversation
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Send a message below and we'll get back to you.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messageGroups.map((group, gi) => (
                                <div key={gi}>
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 px-1">
                                            {group.label}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                    {group.messages.map((msg) => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            isOwn={msg.sender_id === conversation.user_id}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {showFab && messages.length > 0 && (
                        <button
                            onClick={() => scrollToBottom(true)}
                            className="absolute bottom-2 right-2 sm:right-4 z-10 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all"
                        >
                            <ArrowDown className="w-4 h-4 text-foreground" />
                        </button>
                    )}
                </div>

                {convStatus === 'open' && (
                    <form
                        onSubmit={handleSubmit}
                        className="flex-shrink-0 px-3 sm:px-0 pt-2 sm:pt-3 pb-1 sm:pb-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-transparent"
                    >
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={textareaRef}
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 min-h-[42px] sm:min-h-[44px] max-h-28 sm:max-h-32 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white dark:focus:bg-gray-800"
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
                                className="flex-shrink-0 p-2.5 rounded-xl bg-brand text-white hover:bg-brand/90 active:bg-brand/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        </UserDashboardLayout>
    );
}
