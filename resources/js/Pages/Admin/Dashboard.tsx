import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link } from '@inertiajs/react';
import { CalendarDays, Users, FileText, PenSquare, Image, DollarSign, Clock, CheckCircle2, ArrowUpRight, MapPin, Pencil } from 'lucide-react';
import { type DashboardStats, type Event } from '@/types';

interface Props {
    stats: DashboardStats;
    recentEvents: (Event & { registrations_count?: number })[];
}

const STATUS_PILL: Record<string, string> = {
    upcoming: 'bg-brand/15 text-brand border-brand/30',
    past:     'bg-muted text-muted-foreground border-muted-foreground/20',
    draft:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
};

export default function Dashboard({ stats, recentEvents }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Overview of your platform</p>
                </div>

                {/* Primary stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link href="/admin/events" className="group">
                        <div className="rounded-xl border border-border/60 p-5 bg-card hover:border-primary/40 transition-all group-hover:shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-3xl font-bold tabular-nums text-foreground">{stats.events.total}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Events</p>
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                                    {stats.events.upcoming} upcoming
                                </span>
                                <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                    {stats.events.past} past
                                </span>
                                {stats.events.draft > 0 && (
                                    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                        {stats.events.draft} draft
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/registrations" className="group">
                        <div className="rounded-xl border border-border/60 p-5 bg-card hover:border-primary/40 transition-all group-hover:shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                                    <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-3xl font-bold tabular-nums text-foreground">{stats.registrations.total}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Registrations</p>
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> {stats.registrations.confirmed}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                    <Clock className="w-3 h-3 mr-0.5" /> {stats.registrations.pending}
                                </span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/posts" className="group">
                        <div className="rounded-xl border border-border/60 p-5 bg-card hover:border-primary/40 transition-all group-hover:shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                                    <PenSquare className="w-5 h-5 text-secondary-foreground" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-3xl font-bold tabular-nums text-foreground">{stats.posts.total}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">Posts</p>
                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                    {stats.posts.podcast} podcasts
                                </span>
                                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                    {stats.posts.webinar} webinars
                                </span>
                            </div>
                        </div>
                    </Link>

                    <div className="grid grid-rows-2 gap-3">
                        <Link href="/admin/pages" className="group">
                            <div className="rounded-xl border border-border/60 p-4 bg-card hover:border-primary/40 transition-all group-hover:shadow-md h-full flex items-center gap-4">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                                    <FileText className="w-4 h-4 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{stats.pages}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Pages</p>
                                </div>
                            </div>
                        </Link>
                        <Link href="/admin/media" className="group">
                            <div className="rounded-xl border border-border/60 p-4 bg-card hover:border-primary/40 transition-all group-hover:shadow-md h-full flex items-center gap-4">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent">
                                    <Image className="w-4 h-4 text-accent-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{stats.media}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Media Files</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Revenue highlight */}
                {stats.registrations.revenue > 0 && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15">
                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Total Revenue</p>
                            <p className="text-3xl font-bold tabular-nums text-foreground">
                                RM {Number(stats.registrations.revenue).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Recent events */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                            <Link href="/admin/events">View all <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Link>
                        </Button>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Registrations</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <div className="font-medium text-foreground">{event.title}</div>
                                            {event.city && (
                                                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {event.city}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_PILL[event.status] ?? STATUS_PILL.past}`}>
                                                {event.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(event.start_at).toLocaleDateString('en-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold tabular-nums">
                                            {event.rsvp_enabled ? (event.registrations_count ?? 0) : <span className="text-muted-foreground/50 font-normal">—</span>}
                                        </TableCell>
                                        <TableCell className="w-12">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                                                <Link href={`/admin/events/${event.slug}/edit`}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
