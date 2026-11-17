import AdminLayout from '@/Layouts/AdminLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Link } from '@inertiajs/react';
import { ArrowRight, Ticket } from 'lucide-react';

interface EventTicketSummary {
    id: number;
    title: string;
    slug: string;
    start_at: string | null;
    status: string;
    tickets_count: number;
    on_sale_count: number;
    sold: number;
    capacity: number | null;
    currencies: string[];
}

interface Props {
    events: EventTicketSummary[];
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TicketsOverview({ events }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">All Tickets</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Overview of ticket sales across events. Tickets are created and edited on each event's page.
                    </p>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {events.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p>No events with ticketing enabled yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead>Tickets</TableHead>
                                        <TableHead className="hidden sm:table-cell">Sold / Capacity</TableHead>
                                        <TableHead className="hidden lg:table-cell">Currency</TableHead>
                                        <TableHead className="text-right">Manage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map(event => (
                                        <TableRow key={event.id}>
                                            <TableCell className="font-medium">{event.title}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(event.start_at)}</TableCell>
                                            <TableCell>
                                                {event.tickets_count === 0 ? (
                                                    <span className="text-muted-foreground">None yet</span>
                                                ) : (
                                                    <span>
                                                        {event.tickets_count}
                                                        <span className="text-muted-foreground"> · {event.on_sale_count} on sale</span>
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {event.tickets_count === 0 ? '—' : `${event.sold} / ${event.capacity ?? '∞'}`}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="flex gap-1">
                                                    {event.currencies.map(code => (
                                                        <Badge key={code} variant="outline">{code}</Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/admin/events/${event.slug}/tickets`}>
                                                        Manage tickets <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
