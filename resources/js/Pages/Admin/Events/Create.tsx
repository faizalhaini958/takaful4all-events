import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft } from 'lucide-react';

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
        venue_map_media_id: '',
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
                    <h1 className="text-2xl font-bold text-foreground">New Event</h1>
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
