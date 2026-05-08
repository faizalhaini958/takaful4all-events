import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft, Pencil } from 'lucide-react';
import { type Event, type Media, type EventCategory, type RegistrationField } from '@/types';

interface Props {
    event: Event;
    mediaList: Pick<Media, 'id' | 'url' | 'title'>[];
    tickets?: { id: number; name: string }[];
}

function toDatetimeLocal(val: string | null): string {
    if (!val) return '';
    return val.length > 16 ? val.slice(0, 16) : val;
}

export default function EventEdit({ event, tickets }: Props) {
    const { data, setData, put, processing, errors, transform } = useForm({
        title:            event.title,
        slug:             event.slug,
        excerpt:          event.excerpt ?? '',
        content_html:     event.content_html ?? '',
        start_at:         toDatetimeLocal(event.start_at),
        end_at:           toDatetimeLocal(event.end_at ?? null),
        venue:            event.venue ?? '',
        city:             event.city ?? '',
        state:            event.state ?? '',
        country:          event.country ?? 'Malaysia',
        registration_url: event.registration_url ?? '',
        gdrive_link:      event.gdrive_link ?? '',
        is_published:     event.is_published ? '1' : '0',
        media_id:         event.media_id ? String(event.media_id) : 'none',
        rsvp_enabled:     event.rsvp_enabled ?? false,
        rsvp_deadline:    toDatetimeLocal(event.rsvp_deadline ?? null),
        max_attendees:    event.max_attendees ? String(event.max_attendees) : '',
        require_approval: event.require_approval ?? false,
        faqs:             (event.meta_json?.faqs as any[]) ?? [],
        sponsors:         (event.meta_json?.sponsors as any[]) ?? [],
        custom_tabs:      ((event.meta_json?.custom_tabs as any[]) ?? []).map((t: any) => ({
            label: t.label ?? '',
            type: (t.type === 'image' ? 'image' : 'text') as 'image' | 'text',
            content_html: t.content_html ?? '',
            images: ((t.images as any[]) ?? []).map((img: any) => ({ id: String(img.id), url: img.url ?? '' })),
        })),
        event_category:    (event.event_category ?? '') as EventCategory | '',
        registration_fields: (event.registration_fields ?? []) as RegistrationField[],
        terms_conditions: event.terms_conditions ?? '',
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

        put(`/admin/events/${event.slug}`);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/events" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Pencil className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
                        <p className="text-sm text-muted-foreground">{event.title}</p>
                    </div>
                </div>

                <EventForm
                    data={data}
                    errors={errors}
                    processing={processing}
                    setData={setData}
                    onSubmit={submit}
                    submitLabel="Update Event"
                    currentMedia={event.media}
                    eventSlug={event.slug}
                    ticketNames={tickets?.map(t => t.name) ?? []}
                />
            </div>
        </AdminLayout>
    );
}
