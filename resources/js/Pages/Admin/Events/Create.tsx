import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft, CalendarPlus } from 'lucide-react';

export default function EventCreate() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        excerpt: '',
        content_html: '',
        start_at: '',
        end_at: '',
        venue: '',
        city: '',
        state: '',
        country: 'Malaysia',
        registration_url: '',
        gdrive_link: '',
        is_published: '1',
        media_id: '',
        rsvp_enabled: false,
        rsvp_deadline: '',
        max_attendees: '',
        require_approval: false,
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        post('/admin/events');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <CalendarPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">New Event</h1>
                        <p className="text-sm text-muted-foreground">Create a new event with details, venue, and registration settings.</p>
                    </div>
                </div>

                <EventForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Create Event"
                />
            </div>
        </AdminLayout>
    );
}
