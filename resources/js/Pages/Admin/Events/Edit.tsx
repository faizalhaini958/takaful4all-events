import AdminLayout from '@/Layouts/AdminLayout';
import EventForm from '@/Components/EventForm';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';
import { ChevronLeft, Pencil } from 'lucide-react';
import { type Event, type Media } from '@/types';

interface Props {
    event: Event;
    mediaList: Pick<Media, 'id' | 'url' | 'title'>[];
    venueMapMedia: Media | null;
}

function toDatetimeLocal(val: string | null): string {
    if (!val) return '';
    return val.length > 16 ? val.slice(0, 16) : val;
}

export default function EventEdit({ event, venueMapMedia }: Props) {
    const { data, setData, put, processing, errors } = useForm({
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
        venue_map_media_id: event.venue_map_media_id ? String(event.venue_map_media_id) : 'none',
        rsvp_enabled:     event.rsvp_enabled ?? false,
        rsvp_deadline:    toDatetimeLocal(event.rsvp_deadline ?? null),
        max_attendees:    event.max_attendees ? String(event.max_attendees) : '',
        require_approval: event.require_approval ?? false,
    });

    const submit: FormEventHandler = e => {
        e.preventDefault();
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
                    currentVenueMap={venueMapMedia}
                    eventSlug={event.slug}
                />
            </div>
        </AdminLayout>
    );
}
