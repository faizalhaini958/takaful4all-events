import { useCallback, useDeferredValue, useMemo } from 'react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Link } from '@inertiajs/react';
import { MapPin, Calendar, ExternalLink, Eye, Users, Ticket, Palette, FolderOpen, FileText, Image, Loader2, Link2, Save, Plus, Trash2, HelpCircle } from 'lucide-react';
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
    gdrive_link: string;
    is_published: string;
    media_id: string;
    rsvp_enabled: boolean;
    rsvp_deadline: string;
    max_attendees: string;
    require_approval: boolean;
    faqs: { question: string; answer: string }[];
    sponsors: { name: string; role: string; logo_url: string }[];
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
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-7 h-7 opacity-40" />
                <p className="text-xs">Fill in venue / city to see map</p>
            </div>
        );
    }

    const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

    return (
        <div className="rounded-xl overflow-hidden border border-border/60">
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
            <div className="px-3 py-2 bg-muted/40 border-t border-border/60">
                <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
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
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> Event Details
                            </CardTitle>
                        </CardHeader>
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
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <div className="mt-1 flex rounded-xl overflow-hidden border border-border/60 focus-within:ring-2 focus-within:ring-ring bg-background">
                                    <span className="px-3 flex items-center text-xs text-muted-foreground bg-muted border-r border-border/60 whitespace-nowrap font-mono">
                                        /events/
                                    </span>
                                    <input
                                        id="slug"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm bg-background outline-none"
                                    />
                                </div>
                                {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug}</p>}
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
                                {errors.excerpt && <p className="text-sm text-destructive mt-1">{errors.excerpt}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content — WYSIWYG */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> Content
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RichEditor
                                value={data.content_html}
                                onChange={html => setData('content_html', html)}
                                placeholder="Describe the event — agenda, speakers, highlights…"
                            />
                            {errors.content_html && <p className="text-sm text-destructive mt-2">{errors.content_html}</p>}
                        </CardContent>
                    </Card>

                    {/* Date & Time */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Date &amp; Time
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
                                    {errors.start_at && <p className="text-sm text-destructive mt-1">{errors.start_at}</p>}
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
                                    {errors.end_at && <p className="text-sm text-destructive mt-1">{errors.end_at}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> Location
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

                    {/* FAQ Section */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-primary" /> FAQ Section
                            </CardTitle>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setData('faqs', [...data.faqs, { question: '', answer: '' }])}
                                className="h-8 gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Question
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.faqs.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">No FAQs added yet. This section will be hidden on the site.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.faqs.map((faq, index) => (
                                        <div key={index} className="p-4 rounded-xl border border-border/60 bg-muted/20 relative group">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newFaqs = [...data.faqs];
                                                    newFaqs.splice(index, 1);
                                                    setData('faqs', newFaqs);
                                                }}
                                                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Question {index + 1}</Label>
                                                    <Input
                                                        value={faq.question}
                                                        onChange={e => {
                                                            const newFaqs = [...data.faqs];
                                                            newFaqs[index].question = e.target.value;
                                                            setData('faqs', newFaqs);
                                                        }}
                                                        placeholder="eg. Is parking available?"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Answer</Label>
                                                    <Textarea
                                                        value={faq.answer}
                                                        onChange={e => {
                                                            const newFaqs = [...data.faqs];
                                                            newFaqs[index].answer = e.target.value;
                                                            setData('faqs', newFaqs);
                                                        }}
                                                        placeholder="eg. Yes, there is free parking at the venue."
                                                        className="mt-1 resize-none"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sponsors & Organizers Section */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Sponsors &amp; Organizers
                            </CardTitle>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setData('sponsors', [...data.sponsors, { name: '', role: '', logo_url: '' }])}
                                className="h-8 gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Partner
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.sponsors.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">No sponsors or organizers added yet.</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {data.sponsors.map((sponsor, index) => (
                                        <div key={index} className="p-4 rounded-xl border border-border/60 bg-muted/20 relative group">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSponsors = [...data.sponsors];
                                                    newSponsors.splice(index, 1);
                                                    setData('sponsors', newSponsors);
                                                }}
                                                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Partner Name</Label>
                                                    <Input
                                                        value={sponsor.name}
                                                        onChange={e => {
                                                            const newSponsors = [...data.sponsors];
                                                            newSponsors[index].name = e.target.value;
                                                            setData('sponsors', newSponsors);
                                                        }}
                                                        placeholder="eg. Maybank Takaful"
                                                        className="mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Role</Label>
                                                    <Input
                                                        value={sponsor.role}
                                                        onChange={e => {
                                                            const newSponsors = [...data.sponsors];
                                                            newSponsors[index].role = e.target.value;
                                                            setData('sponsors', newSponsors);
                                                        }}
                                                        placeholder="eg. Platinum Sponsor"
                                                        className="mt-1 h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Logo URL</Label>
                                                    <Input
                                                        value={sponsor.logo_url}
                                                        onChange={e => {
                                                            const newSponsors = [...data.sponsors];
                                                            newSponsors[index].logo_url = e.target.value;
                                                            setData('sponsors', newSponsors);
                                                        }}
                                                        placeholder="https://…"
                                                        className="mt-1 h-8 text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* Publish */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Save className="w-4 h-4 text-primary" /> Publish
                            </CardTitle>
                        </CardHeader>
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
                                {errors.registration_url && <p className="text-sm text-destructive mt-1">{errors.registration_url}</p>}
                            </div>

                            <div>
                                <Label htmlFor="gdrive_link">
                                    <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                                    Google Drive Link <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Input
                                    id="gdrive_link"
                                    type="url"
                                    value={data.gdrive_link}
                                    onChange={e => setData('gdrive_link', e.target.value)}
                                    className="mt-1"
                                    placeholder="https://drive.google.com/…"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Link to photo/video album for this event.</p>
                                {errors.gdrive_link && <p className="text-sm text-destructive mt-1">{errors.gdrive_link}</p>}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                    ) : (
                                        <><Save className="mr-2 h-4 w-4" /> {submitLabel}</>
                                    )}
                                </Button>
                                {eventSlug && (
                                    <a
                                        href={`/events/${eventSlug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
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
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="w-4 h-4 text-primary" /> Featured Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUpload
                                value={data.media_id}
                                currentMedia={currentMedia}
                                onChange={(id) => setData('media_id', id)}
                                onClear={() => setData('media_id', 'none')}
                            />
                            {errors.media_id && <p className="text-sm text-destructive mt-2">{errors.media_id}</p>}
                        </CardContent>
                    </Card>

                    {/* RSVP / Registration Settings */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-primary" /> RSVP / Registration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
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

                                    <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
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
                                        <div className="pt-2 space-y-1.5 border-t border-border/60">
                                            <Link
                                                href={`/admin/events/${eventSlug}/tickets`}
                                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                            >
                                                <Ticket className="w-3.5 h-3.5" /> Manage Tickets
                                            </Link>
                                            <Link
                                                href={`/admin/events/${eventSlug}/products`}
                                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                            >
                                                <Users className="w-3.5 h-3.5" /> Manage Products
                                            </Link>
                                            <Link
                                                href={`/admin/events/${eventSlug}/registrations`}
                                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                            >
                                                <Users className="w-3.5 h-3.5" /> View Registrations
                                            </Link>
                                            <Link
                                                href={`/admin/events/${eventSlug}/zones`}
                                                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                                            >
                                                <Palette className="w-3.5 h-3.5" /> Manage Zones
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
