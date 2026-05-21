import { useCallback, useDeferredValue, useMemo, useRef, useState } from 'react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/Components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Link } from '@inertiajs/react';
import { MapPin, Calendar, ExternalLink, Eye, Users, Ticket, Palette, FolderOpen, FileText, Image, Loader2, Link2, Save, Plus, Trash2, HelpCircle, LayoutTemplate, ClipboardList, RefreshCw, AlertTriangle, ArrowUp, ChevronDown } from 'lucide-react';
import RichEditor from '@/Components/RichEditor';
import ImageUpload from '@/Components/ImageUpload';
import RegistrationFieldBuilder from '@/Components/RegistrationFieldBuilder';
import { CATEGORY_OPTIONS, CATEGORY_LABELS, CATEGORY_TEMPLATES } from '@/lib/registration-templates';
import { type Media, type Event, type EventCategory, type RegistrationField } from '@/types';

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
    sponsors: { name: string; role: string; logo_url: string; sort_order: number }[];
    custom_tabs: { label: string; type: 'text' | 'image'; content_html: string; images: { id: string; url: string }[] }[];
    event_category: EventCategory | '';
    registration_fields: RegistrationField[];
    terms_conditions: string;
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
    /** Ticket names for ticket-scoped field configuration (edit mode only) */
    ticketNames?: string[];
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
    ticketNames,
}: Props) {
    const mapQuery = useMemo(
        () => [data.venue, data.city, data.state, data.country].filter(Boolean).join(', '),
        [data.venue, data.city, data.state, data.country],
    );
    // Defer map iframe update so it doesn't re-render on every keystroke
    const deferredMapQuery = useDeferredValue(mapQuery);

    const [fieldsCollapsed, setFieldsCollapsed] = useState(false);
    const [publishExpanded, setPublishExpanded] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [fieldsDirty, setFieldsDirty] = useState(false);
    const prevCategoryRef = useRef<EventCategory | ''>(data.event_category);

    const handleCategoryChange = useCallback((newCat: string) => {
        const prev = prevCategoryRef.current;
        prevCategoryRef.current = newCat as EventCategory | '';

        // Auto-swap template when the current fields are still the unchanged template
        // of the previous category (i.e. no customisations have been made).
        if (newCat && newCat !== prev) {
            const currentKeys = data.registration_fields.map(f => f.key).join(',');
            const prevTemplateKeys = prev
                ? CATEGORY_TEMPLATES[prev as EventCategory].map(f => f.key).join(',')
                : '';
            const isUnmodified = currentKeys === prevTemplateKeys || data.registration_fields.length === 0;

            setData('event_category', newCat as EventCategory);
            if (isUnmodified) {
                setData('registration_fields', CATEGORY_TEMPLATES[newCat as EventCategory]);
                return;
            }
        } else {
            setData('event_category', newCat as EventCategory | '');
        }
    }, [data.registration_fields, setData]);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('title', e.target.value);
            // Only auto-gen slug when it's still empty or was previously auto-gen'd
            setData('slug', generateSlug(e.target.value));
        },
        [setData],
    );

    return (
        <>
        <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Reset to template?
                    </DialogTitle>
                    <DialogDescription className="pt-1">
                        This will replace all current fields with the{' '}
                        <strong>&ldquo;{data.event_category ? CATEGORY_LABELS[data.event_category as EventCategory] : ''}&rdquo;</strong>{' '}
                        template. Any customisations you&apos;ve made will be lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                            setData('registration_fields', CATEGORY_TEMPLATES[data.event_category as EventCategory]);
                            setFieldsDirty(true);
                            setResetConfirmOpen(false);
                        }}
                    >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Yes, reset fields
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <form
            onSubmit={e => { setFieldsDirty(false); onSubmit(e); }}
            onKeyDown={e => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                    e.preventDefault();
                }
            }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ── Left column ── */}
                <div className="space-y-6 min-w-0">

                    {/* Details */}
                    <Card className="rounded-xl border-border/60 border-l-4 border-l-primary/40">
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
                    <Card className="rounded-xl border-border/60 border-l-4 border-l-primary/40">
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
                    <Card className="rounded-xl border-border/60 border-l-4 border-l-primary/40">
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
                    <Card className="rounded-xl border-border/60 border-l-4 border-l-primary/40">
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

                    {/* ── Registration Setup group ── */}
                    <div className="rounded-2xl border border-border/50 bg-muted/25 p-1 space-y-1">
                        {/* Group label */}
                        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-widest">Registration Setup</span>
                        </div>

                        {/* Category & Registration Fields */}
                        <Card className="rounded-xl border-border/60 shadow-none bg-background">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-primary" /> Category &amp; Registration Fields
                                </CardTitle>
                                {/* Collapse toggle */}
                                <button
                                    type="button"
                                    onClick={() => setFieldsCollapsed(v => !v)}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
                                >
                                    {data.registration_fields.length > 0 && (
                                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem]">
                                            {data.registration_fields.length}
                                        </span>
                                    )}
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${fieldsCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                            </CardHeader>
                            {!fieldsCollapsed && (
                                <CardContent className="space-y-4">
                                    {/* Category selector */}
                                    <div>
                                        <Label htmlFor="event_category">Event Category</Label>
                                        <p className="text-xs text-muted-foreground mb-1.5">Selecting a category loads a default set of registration fields. You can customise them below.</p>
                                        <Select
                                            value={data.event_category || ''}
                                            onValueChange={handleCategoryChange}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Select a category…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORY_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Load template button */}
                                    {data.event_category && (
                                        <div className={`flex items-start gap-3 rounded-lg p-3 border ${
                                            data.registration_fields.length === 0
                                                ? 'bg-primary/5 border-primary/20'
                                                : 'bg-amber-50 border-amber-200'
                                        }`}>
                                            {data.registration_fields.length > 0 && (
                                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                    {data.registration_fields.length === 0
                                                        ? `Load "${CATEGORY_LABELS[data.event_category as EventCategory]}" template`
                                                        : `Reset to "${CATEGORY_LABELS[data.event_category as EventCategory]}" template`
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {data.registration_fields.length === 0
                                                        ? 'Click to populate the fields below with the default template for this category.'
                                                        : 'This will replace all current fields with the default template. Your customisations will be lost.'
                                                    }
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={data.registration_fields.length === 0 ? 'default' : 'outline'}
                                                size="sm"
                                                className="flex-shrink-0 gap-1.5"
                                                onClick={() => {
                                                    if (data.registration_fields.length > 0) {
                                                        setResetConfirmOpen(true);
                                                    } else {
                                                        setData('registration_fields', CATEGORY_TEMPLATES[data.event_category as EventCategory]);
                                                        setFieldsDirty(true);
                                                    }
                                                }}
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                {data.registration_fields.length === 0 ? 'Load Template' : 'Reset'}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Field builder */}
                                    {fieldsDirty && (
                                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
                                            <Save className="w-3.5 h-3.5 flex-shrink-0" />
                                            Fields updated — <strong>remember to save</strong> to apply changes to the public page.
                                        </div>
                                    )}
                                    <div className="border-t border-border/40 pt-4">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Registration Fields</p>
                                        <RegistrationFieldBuilder
                                            fields={data.registration_fields}
                                            onChange={fields => setData('registration_fields', fields)}
                                            ticketNames={ticketNames}
                                        />
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                    </div>{/* end Registration Setup group */}

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
                        {data.faqs.length > 0 && (
                            <CardContent className="space-y-4">
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
                            </CardContent>
                        )}
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
                                onClick={() => setData('sponsors', [...data.sponsors, { name: '', role: '', logo_url: '', sort_order: 1 }])}
                                className="h-8 gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Partner
                            </Button>
                        </CardHeader>
                        {data.sponsors.length > 0 && (
                            <CardContent className="space-y-4">
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
                                                <div>
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tier Order</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={sponsor.sort_order ?? 1}
                                                        onChange={e => {
                                                            const newSponsors = [...data.sponsors];
                                                            newSponsors[index].sort_order = parseInt(e.target.value) || 1;
                                                            setData('sponsors', newSponsors);
                                                        }}
                                                        className="mt-1 h-8 text-sm w-24"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground mt-1">1 = Platinum row, 2 = Gold row, etc.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Custom Tabs Section */}
                    <Card className="rounded-xl border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-primary" /> Custom Tabs
                            </CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setData('custom_tabs', [...data.custom_tabs, { label: '', type: 'text', content_html: '', images: [] }])}
                                className="h-8 gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Tab
                            </Button>
                        </CardHeader>
                        {data.custom_tabs.length > 0 && (
                            <CardContent className="space-y-6">
                                {data.custom_tabs.map((tab, index) => (
                                    <div key={index} className="rounded-xl border border-border/60 p-4 space-y-4 relative">
                                        {/* Remove tab button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const next = [...data.custom_tabs];
                                                next.splice(index, 1);
                                                setData('custom_tabs', next);
                                            }}
                                            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {/* Tab label */}
                                        <div>
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tab Label</Label>
                                            <Input
                                                value={tab.label}
                                                onChange={e => {
                                                    const next = [...data.custom_tabs];
                                                    next[index] = { ...next[index], label: e.target.value };
                                                    setData('custom_tabs', next);
                                                }}
                                                placeholder="eg. Race Kit, Itinerary…"
                                                className="mt-1 h-9 text-sm"
                                            />
                                        </div>

                                        {/* Content type toggle */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...data.custom_tabs];
                                                    next[index] = { ...next[index], type: 'text' };
                                                    setData('custom_tabs', next);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-semibold transition-all ${tab.type === 'text' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Text
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = [...data.custom_tabs];
                                                    next[index] = { ...next[index], type: 'image' };
                                                    setData('custom_tabs', next);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-semibold transition-all ${tab.type === 'image' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
                                            >
                                                <Image className="w-3.5 h-3.5" /> Image
                                            </button>
                                        </div>

                                        {/* Content based on type */}
                                        {tab.type === 'text' && (
                                            <RichEditor
                                                value={tab.content_html}
                                                onChange={html => {
                                                    const next = [...data.custom_tabs];
                                                    next[index] = { ...next[index], content_html: html };
                                                    setData('custom_tabs', next);
                                                }}
                                                placeholder="Write the tab content…"
                                            />
                                        )}

                                        {tab.type === 'image' && (
                                            <div className="space-y-3">
                                                {tab.images.map((img, imgIndex) => (
                                                    <div key={imgIndex} className="relative">
                                                        <ImageUpload
                                                            value={img.id}
                                                            currentMedia={img.id && img.id !== 'none' ? { id: Number(img.id), url: img.url, title: '' } as unknown as Media : null}
                                                            onChange={(id, media) => {
                                                                const next = [...data.custom_tabs];
                                                                const imgs = [...next[index].images];
                                                                imgs[imgIndex] = { id, url: media.url };
                                                                next[index] = { ...next[index], images: imgs };
                                                                setData('custom_tabs', next);
                                                            }}
                                                            onClear={() => {
                                                                const next = [...data.custom_tabs];
                                                                const imgs = [...next[index].images];
                                                                imgs.splice(imgIndex, 1);
                                                                next[index] = { ...next[index], images: imgs };
                                                                setData('custom_tabs', next);
                                                            }}
                                                        />
                                                        {tab.images.length > 1 && (
                                                            <span className="absolute -top-2 -left-2 bg-muted text-muted-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-border/60">
                                                                {imgIndex + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const next = [...data.custom_tabs];
                                                        next[index] = { ...next[index], images: [...next[index].images, { id: '', url: '' }] };
                                                        setData('custom_tabs', next);
                                                    }}
                                                    className="w-full h-8 gap-1 border-dashed"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add Image
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5 sticky top-4 self-start min-w-0">

                    {/* Publish */}
                    <Card className="rounded-xl border-border/60 bg-muted/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Save className="w-4 h-4 text-primary" /> Publish
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">

                            {/* ── Status — always visible, prominent ── */}
                            <Select value={data.is_published} onValueChange={v => setData('is_published', v)}>
                                <SelectTrigger className={`font-semibold ${data.is_published === '1' ? 'border-green-400 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">✅ Published</SelectItem>
                                    <SelectItem value="0">📝 Draft</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* ── View on site — always visible ── */}
                            {eventSlug && (
                                <a
                                    href={`/events/${eventSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline py-0.5"
                                >
                                    <Eye className="w-3.5 h-3.5" /> View on site
                                </a>
                            )}

                            {/* ── Optional fields toggle ── */}
                            <button
                                type="button"
                                onClick={() => setPublishExpanded(v => !v)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-1"
                            >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${publishExpanded ? 'rotate-180' : ''}`} />
                                {publishExpanded ? 'Hide optional settings' : 'More settings'}
                                {(data.registration_url || data.gdrive_link) && !publishExpanded && (
                                    <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-primary/60" title="Has values" />
                                )}
                            </button>

                            {publishExpanded && (
                                <div className="space-y-3 pt-1 border-t border-border/50">
                                    <div>
                                        <Label htmlFor="registration_url" className="text-xs">Registration URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                        <Input
                                            id="registration_url"
                                            type="url"
                                            value={data.registration_url}
                                            onChange={e => setData('registration_url', e.target.value)}
                                            className="mt-1 h-8 text-sm"
                                            placeholder="https://…"
                                        />
                                        {errors.registration_url && <p className="text-xs text-destructive mt-1">{errors.registration_url}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="gdrive_link" className="text-xs">
                                            <FolderOpen className="w-3 h-3 inline mr-1" />
                                            Google Drive Link <span className="text-muted-foreground font-normal">(optional)</span>
                                        </Label>
                                        <Input
                                            id="gdrive_link"
                                            type="url"
                                            value={data.gdrive_link}
                                            onChange={e => setData('gdrive_link', e.target.value)}
                                            className="mt-1 h-8 text-sm"
                                            placeholder="https://drive.google.com/…"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Photo/video album for this event.</p>
                                        {errors.gdrive_link && <p className="text-xs text-destructive mt-1">{errors.gdrive_link}</p>}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card className="rounded-xl border-border/60 bg-muted/20 shadow-sm">
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
                    <Card className="rounded-xl border-border/60 bg-muted/20 shadow-sm">
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

                    {/* Terms & Conditions */}
                    <Card className="rounded-xl border-border/60 bg-muted/20 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> Terms &amp; Conditions
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                If set, registrants must agree before completing registration. Leave blank to skip.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id="terms_conditions"
                                value={data.terms_conditions}
                                onChange={e => setData('terms_conditions', e.target.value)}
                                rows={5}
                                className="resize-y font-mono text-sm"
                                placeholder="Enter your event terms and conditions here…"
                            />
                            {errors.terms_conditions && (
                                <p className="text-xs text-red-600 mt-1">{errors.terms_conditions}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Sticky bottom save bar ── */}
            <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 mt-6 border-t border-border/60 bg-background/95 backdrop-blur-sm shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3">
                {/*
                  3-column grid: left / centre / right.
                  Each column is equal width (grid-cols-3) so the centre is always
                  truly centred regardless of how many buttons are in left or right.
                  To add more buttons later: drop them inside the left or right <div>.
                */}
                <div className="grid grid-cols-3 items-center gap-2 max-w-screen-xl mx-auto">

                    {/* Left group — destructive / secondary actions */}
                    <div className="flex items-center gap-2 justify-start">
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                        >
                            <Link href="/admin/events">Cancel</Link>
                        </Button>
                    </div>

                    {/* Centre — utility */}
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-border/60 hover:border-border hover:bg-muted/60"
                        >
                            <ArrowUp className="w-3.5 h-3.5" /> Back to top
                        </button>
                    </div>

                    {/* Right group — primary action(s) */}
                    <div className="flex items-center gap-2 justify-end">
                        <Button type="submit" disabled={processing} className="shadow-sm">
                            {processing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> {submitLabel}</>
                            )}
                        </Button>
                    </div>

                </div>
            </div>
        </form>
        </>
    );
}
