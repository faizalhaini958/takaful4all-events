import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { EventAnalyticsPanel } from '@/Components/EventAnalyticsPanel';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
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
        sponsors:         ((event.meta_json?.sponsors as any[]) ?? []).map((s: any) => ({ ...s, logo_media_id: s.logo_media_id ?? '' })),
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
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5 flex-wrap">
                        <Link href="/admin" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <Link href="/admin/events" className="hover:text-foreground transition-colors">Events</Link>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium truncate max-w-[180px]">{event.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-foreground font-medium">Edit</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Pencil className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
                            <p className="text-sm text-muted-foreground">{event.title}</p>
                        </div>
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

                <EventAnalyticsPanel slug={event.slug} />
            </div>
        </AdminLayout>
    );
}
