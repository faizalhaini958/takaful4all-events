import { useCallback, useDeferredValue, useMemo } from 'react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Link } from '@inertiajs/react';
import { MapPin, Calendar, ExternalLink, Eye, Users, Ticket } from 'lucide-react';
import RichEditor from '@/Components/RichEditor';
import ImageUpload from '@/Components/ImageUpload';
import { type Media, type Event } from '@/types';

export interface EventFormData {
    title: string;
    slug: string;
    excerpt: string;
    content_html: string;
    start_at: string;
    end_at: string;
    venue: string;
    city: string;
    state: string;
    country: string;
    registration_url: string;
    is_published: string;
    media_id: string;
    rsvp_enabled: boolean;
    rsvp_deadline: string;
    max_attendees: string;
    require_approval: boolean;
}

interface Props {
    data: EventFormData;
    errors: Partial<Record<keyof EventFormData, string>>;
    processing: boolean;
    setData: <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => void;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    currentMedia?: Media | null;
    /** For the "View on site" link in edit mode */
    eventSlug?: string;
}

function generateSlug(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function MapPreview({ query }: { query: string }) {
    if (!query.trim()) {
        return (
            <div className="rounded-lg bg-gray-100 border border-dashed border-gray-300 h-44 flex flex-col items-center justify-center gap-2 text-gray-400">
                <MapPin className="w-7 h-7" />
                <p className="text-xs">Fill in venue / city to see map</p>
            </div>
        );
    }

    const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

    return (
        <div className="rounded-lg overflow-hidden border border-input">
            <iframe
                key={query}           // remount on query change
                title="Venue map"
                src={src}
                width="100%"
                height="176"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full"
            />
            <div className="px-3 py-2 bg-gray-50 border-t border-input">
                <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
                >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
}

export default function EventForm({
    data,
    errors,
    processing,
    setData,
    onSubmit,
    submitLabel,
    currentMedia,
    eventSlug,
}: Props) {
    const mapQuery = useMemo(
        () => [data.venue, data.city, data.state, data.country].filter(Boolean).join(', '),
        [data.venue, data.city, data.state, data.country],
    );
    // Defer map iframe update so it doesn't re-render on every keystroke
    const deferredMapQuery = useDeferredValue(mapQuery);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('title', e.target.value);
            // Only auto-gen slug when it's still empty or was previously auto-gen'd
            setData('slug', generateSlug(e.target.value));
        },
        [setData],
    );

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ── Left column ── */}
                <div className="space-y-6">

                    {/* Details */}
                    <Card>
                        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={handleTitleChange}
                                    placeholder="eg. Takaful Leader & Agent Summit 2025"
                                    className="mt-1"
                                />
                                {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <div className="mt-1 flex rounded-md overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring bg-white">
                                    <span className="px-3 flex items-center text-xs text-muted-foreground bg-muted border-r border-input whitespace-nowrap">
                                        /events/
                                    </span>
                                    <input
                                        id="slug"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-white outline-none"
                                    />
                                </div>
                                {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug}</p>}
                            </div>

                            <div>
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    rows={3}
                                    placeholder="Short summary shown on event cards and the hero pull-quote…"
                                    className="mt-1 resize-none"
                                />
                                {errors.excerpt && <p className="text-sm text-red-600 mt-1">{errors.excerpt}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content — WYSIWYG */}
                    <Card>
                        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
                        <CardContent>
                            <RichEditor
                                value={data.content_html}
                                onChange={html => setData('content_html', html)}
                                placeholder="Describe the event — agenda, speakers, highlights…"
                            />
                            {errors.content_html && <p className="text-sm text-red-600 mt-2">{errors.content_html}</p>}
                        </CardContent>
                    </Card>

                    {/* Date & Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-brand" /> Date &amp; Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start_at">Start *</Label>
                                    <Input
                                        id="start_at"
                                        type="datetime-local"
                                        value={data.start_at}
                                        onChange={e => setData('start_at', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.start_at && <p className="text-sm text-red-600 mt-1">{errors.start_at}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="end_at">End</Label>
                                    <Input
                                        id="end_at"
                                        type="datetime-local"
                                        value={data.end_at}
                                        onChange={e => setData('end_at', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.end_at && <p className="text-sm text-red-600 mt-1">{errors.end_at}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand" /> Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="venue">Venue name</Label>
                                <Input
                                    id="venue"
                                    value={data.venue}
                                    onChange={e => setData('venue', e.target.value)}
                                    placeholder="eg. Connexion Conference Centre (Nexus)"
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city" value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                        placeholder="Kuala Lumpur"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state" value={data.state}
                                        onChange={e => setData('state', e.target.value)}
                                        placeholder="W.P. KL"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country" value={data.country}
                                        onChange={e => setData('country', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Live map preview */}
                            <div>
                                <Label className="mb-1.5 block">Map preview</Label>
                                <MapPreview query={deferredMapQuery} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* Publish */}
                    <Card>
                        <CardHeader><CardTitle>Publish</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="is_published">Status</Label>
                                <Select value={data.is_published} onValueChange={v => setData('is_published', v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">✅ Published</SelectItem>
                                        <SelectItem value="0">📝 Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="registration_url">Registration URL <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                                <Input
                                    id="registration_url"
                                    type="url"
                                    value={data.registration_url}
                                    onChange={e => setData('registration_url', e.target.value)}
                                    className="mt-1"
                                    placeholder="https://…"
                                />
                                {errors.registration_url && <p className="text-sm text-red-600 mt-1">{errors.registration_url}</p>}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button type="submit" disabled={processing} className="w-full bg-brand hover:bg-brand-dark">
                                    {processing ? 'Saving…' : submitLabel}
                                </Button>
                                {eventSlug && (
                                    <a
                                        href={`/events/${eventSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors py-1"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> View on site
                                    </a>
                                )}
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/admin/events">Cancel</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                        <CardHeader><CardTitle>Featured Image</CardTitle></CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={data.media_id}
                                currentMedia={currentMedia}
                                onChange={(id) => setData('media_id', id)}
                                onClear={() => setData('media_id', 'none')}
                            />
                            {errors.media_id && <p className="text-sm text-red-600 mt-2">{errors.media_id}</p>}
                        </CardContent>
                    </Card>

                    {/* RSVP / Registration Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-brand" /> RSVP / Registration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rsvp_enabled" className="cursor-pointer">Enable RSVP</Label>
                                <Switch
                                    id="rsvp_enabled"
                                    checked={data.rsvp_enabled}
                                    onCheckedChange={(checked) => setData('rsvp_enabled', checked)}
                                />
                            </div>

                            {data.rsvp_enabled && (
                                <>
                                    <div>
                                        <Label htmlFor="rsvp_deadline">Registration Deadline</Label>
                                        <Input
                                            id="rsvp_deadline"
                                            type="datetime-local"
                                            value={data.rsvp_deadline}
                                            onChange={e => setData('rsvp_deadline', e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="max_attendees">Max Attendees <span className="text-xs text-muted-foreground font-normal">(blank = unlimited)</span></Label>
                                        <Input
                                            id="max_attendees"
                                            type="number"
                                            value={data.max_attendees}
                                            onChange={e => setData('max_attendees', e.target.value)}
                                            className="mt-1"
                                            placeholder="Unlimited"
                                            min="1"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="require_approval" className="cursor-pointer">Require Approval</Label>
                                            <p className="text-xs text-muted-foreground">Registrations need manual approval</p>
                                        </div>
                                        <Switch
                                            id="require_approval"
                                            checked={data.require_approval}
                                            onCheckedChange={(checked) => setData('require_approval', checked)}
                                        />
                                    </div>

                                    {eventSlug && (
                                        <div className="pt-1 space-y-1.5 border-t">
                                            <Link
                                                href={`/admin/events/${eventSlug}/tickets`}
                                                className="flex items-center gap-1.5 text-xs text-brand hover:underline font-medium"
                                            >
                                                <Ticket className="w-3.5 h-3.5" /> Manage Tickets
                                            </Link>
                                            <Link
                                                href={`/admin/events/${eventSlug}/products`}
                                                className="flex items-center gap-1.5 text-xs text-brand hover:underline font-medium"
                                            >
                                                <Users className="w-3.5 h-3.5" /> Manage Products
                                            </Link>
                                            <Link
                                                href={`/admin/events/${eventSlug}/registrations`}
                                                className="flex items-center gap-1.5 text-xs text-brand hover:underline font-medium"
                                            >
                                                <Users className="w-3.5 h-3.5" /> View Registrations
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
