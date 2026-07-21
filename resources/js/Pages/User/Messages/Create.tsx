import { useForm, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { type Event } from '@/types';

interface Props {
    events: Event[];
}

export default function Create({ events }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        event_id: '',
        body: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/dashboard/messages');
    };

    return (
        <UserDashboardLayout title="New Message">
            <Head title="New Message" />

            <div className="max-w-2xl">
                <Link
                    href="/dashboard/messages"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 active:text-brand transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to messages
                </Link>

                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">New Message</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                    Send us a message and we'll reply as soon as possible.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-foreground mb-1.5">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                            placeholder="What's this about?"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        />
                        {errors.subject && (
                            <p className="text-xs text-red-500 mt-1">{errors.subject}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-foreground mb-1.5">
                            Related event (optional)
                        </label>
                        <select
                            value={data.event_id}
                            onChange={(e) => setData('event_id', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        >
                            <option value="">No specific event</option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.title}
                                </option>
                            ))}
                        </select>
                        {errors.event_id && (
                            <p className="text-xs text-red-500 mt-1">{errors.event_id}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[13px] sm:text-sm font-medium text-foreground mb-1.5">
                            Message
                        </label>
                        <textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            placeholder="Type your message here..."
                            rows={5}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-y min-h-[120px]"
                        />
                        {errors.body && (
                            <p className="text-xs text-red-500 mt-1">{errors.body}</p>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
                        <p className="text-[11px] sm:text-xs text-muted-foreground sm:flex-1">
                            We typically reply within 24 hours.
                        </p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 active:bg-brand/80 disabled:opacity-50 transition-colors shadow-sm w-full sm:w-auto"
                        >
                            <Send className="w-4 h-4" />
                            {processing ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>
        </UserDashboardLayout>
    );
}
