import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft, CalendarPlus } from 'lucide-react';
import { type EventCategory, type RegistrationField } from '@/types';

export default function EventCreate() {
    const { data, setData, post, processing, errors, transform } = useForm({
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
        faqs: [] as { question: string; answer: string }[],
        sponsors: [] as { name: string; role: string; logo_url: string; sort_order: number }[],
        custom_tabs: [] as { label: string; type: 'text' | 'image'; content_html: string; images: { id: string; url: string }[] }[],
        event_category: '' as EventCategory | '',
        registration_fields: [] as RegistrationField[],
        terms_conditions: '',
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
        
        transform((data) => ({
            ...data,
            media_id: data.media_id && data.media_id !== 'none' ? data.media_id : null,
            meta_json: {
                faqs: data.faqs,
                sponsors: data.sponsors,
                custom_tabs: data.custom_tabs
                    .filter(t => t.label.trim())
                    .map(t => ({
                        label: t.label,
                        type: t.type,
                        content_html: t.type === 'text' ? t.content_html : '',
                        images: t.type === 'image' ? t.images.filter(img => img.id && img.id !== 'none') : [],
                    })),
            }
        }));
        
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
