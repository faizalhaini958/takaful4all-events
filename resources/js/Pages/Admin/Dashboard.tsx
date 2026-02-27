import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link } from '@inertiajs/react';
import { type DashboardStats, type Event } from '@/types';

interface Props {
    stats: DashboardStats;
    recentEvents: Event[];
}

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    upcoming: 'default',
    past:     'secondary',
    draft:    'outline',
};

export default function Dashboard({ stats, recentEvents }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.events.total}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="default" className="text-xs">{stats.events.upcoming} upcoming</Badge>
                                <Badge variant="secondary" className="text-xs">{stats.events.past} past</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.posts.total}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{stats.posts.podcast} podcasts</Badge>
                                <Badge variant="outline" className="text-xs">{stats.posts.webinar} webinars</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.pages}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Media Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{stats.media}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent events table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Events</CardTitle>
                            <Link href="/admin/events" className="text-sm text-brand-navy hover:underline">View all →</Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentEvents.map(event => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium max-w-xs truncate">{event.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_BADGE[event.status] ?? 'secondary'}>
                                                {event.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(event.start_at).toLocaleDateString('en-MY')}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{event.city ?? '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/events/${event.id}/edit`}
                                                className="text-sm text-brand-navy hover:underline"
                                            >
                                                Edit
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
