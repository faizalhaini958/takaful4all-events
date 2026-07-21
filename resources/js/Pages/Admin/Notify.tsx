import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Bell, Search, X, Send, Users, Building2, CalendarDays, User, Loader2, AlertTriangle, Check, Filter, Clock, Inbox, ChevronLeft, Hash } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';

interface Event {
    id: number;
    title: string;
    slug: string;
    start_at: string;
    registrants_count: number;
}

interface Role {
    value: string;
    label: string;
}

interface UserSearch {
    id?: number;
    name: string;
    email: string;
    role?: string;
}

interface PaginatedUsers {
    data: UserSearch[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Stats {
    total_users: number;
    total_admin: number;
    total_checkin_staff: number;
    total_public: number;
    total_event_registrants: number;
}

interface SentNotification {
    id: number;
    title: string;
    body: string;
    action_url: string | null;
    recipient_type: string;
    recipient_label: string;
    recipient_count: number;
    created_at: string;
    user?: { id: number; name: string };
}

interface PaginatedSent {
    data: SentNotification[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    events: Event[];
    roles: Role[];
    stats: Stats;
}

type RecipientType = 'all' | 'role' | 'event' | 'individual';

const RECIPIENT_OPTIONS: { value: RecipientType; label: string; icon: React.ElementType; description: string }[] = [
    { value: 'all',        label: 'All Users',       icon: Users,       description: 'Every registered user' },
    { value: 'role',       label: 'By Role',         icon: Building2,   description: 'Filter by user role' },
    { value: 'event',      label: 'By Event',        icon: CalendarDays, description: 'Event registrants' },
    { value: 'individual', label: 'Specific Users',  icon: User,        description: 'Pick individually' },
];

export default function Notify({ events, roles, stats }: Props) {
    const [tab, setTab] = useState<'compose' | 'sent'>('compose');

    return (
        <AdminLayout>
            <Head title="Notify — Admin" />

            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.visit('/admin')} title="Back">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notify Users</h1>
                        <p className="text-sm text-muted-foreground">Send in-app notifications to users</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant={tab === 'compose' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTab('compose')}
                        >
                            <Send className="w-4 h-4 mr-1.5" /> Compose
                        </Button>
                        <Button
                            variant={tab === 'sent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTab('sent')}
                        >
                            <Inbox className="w-4 h-4 mr-1.5" /> Sent
                        </Button>
                    </div>
                </div>

                {tab === 'compose' ? (
                    <ComposeTab events={events} roles={roles} stats={stats} />
                ) : (
                    <SentTab />
                )}
            </div>
        </AdminLayout>
    );
}

function ComposeTab({ events, roles, stats }: { events: Event[]; roles: Role[]; stats: Stats }) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [recipientType, setRecipientType] = useState<RecipientType>('all');
    const [recipientRole, setRecipientRole] = useState('');
    const [recipientEventId, setRecipientEventId] = useState<number | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<UserSearch[]>([]);
    const [sending, setSending] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSubmit = () => {
        setConfirmOpen(false);
        setSending(true);

        router.post('/admin/notify', {
            title,
            body,
            action_url: actionUrl || undefined,
            recipient_type: recipientType,
            ...(recipientType === 'role' ? { recipient_role: recipientRole } : {}),
            ...(recipientType === 'event' && recipientEventId ? { recipient_event_id: recipientEventId } : {}),
            ...(recipientType === 'individual' ? { recipient_emails: selectedUsers.map(u => u.email) } : {}),
        }, {
            onFinish: () => setSending(false),
            onSuccess: () => {
                setTitle('');
                setBody('');
                setActionUrl('');
                setSelectedUsers([]);
            },
        });
    };

    const recipientLabel = () => {
        switch (recipientType) {
            case 'all': return 'All Users';
            case 'role': return `Role: ${recipientRole || 'not selected'}`;
            case 'event': {
                const evt = events.find(e => e.id === recipientEventId);
                return evt ? `Registrants of: ${evt.title}` : 'No event selected';
            }
            case 'individual': return `${selectedUsers.length} selected user(s)`;
        }
    };

    const recipientCount = () => {
        switch (recipientType) {
            case 'all': return stats.total_users;
            case 'role': {
                if (recipientRole === 'admin') return stats.total_admin;
                if (recipientRole === 'checkin_staff') return stats.total_checkin_staff;
                if (recipientRole === 'public') return stats.total_public;
                return 0;
            }
            case 'event': {
                const evt = events.find(e => e.id === recipientEventId);
                return evt?.registrants_count ?? 0;
            }
            case 'individual': return selectedUsers.length;
        }
    };

    const canSend = title.trim() && body.trim() && recipientCount() > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Recipient selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recipients</CardTitle>
                        <CardDescription>Choose who receives this notification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {RECIPIENT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        setRecipientType(opt.value);
                                        setSelectedUsers([]);
                                    }}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                                        recipientType === opt.value
                                            ? 'border-brand bg-brand/5 text-brand'
                                            : 'border-border hover:border-brand/40 hover:bg-muted/50 text-muted-foreground'
                                    }`}
                                >
                                    <opt.icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{opt.label}</span>
                                    <span className="text-[10px] opacity-70 leading-tight">{opt.description}</span>
                                </button>
                            ))}
                        </div>

                        <Separator />

                        {recipientType === 'all' && (
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">{stats.total_users}</span> registered user(s) will receive this notification.
                            </div>
                        )}

                        {recipientType === 'role' && (
                            <div className="max-w-xs">
                                <Label>Select Role</Label>
                                <Select value={recipientRole} onValueChange={setRecipientRole}>
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Choose a role..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {recipientRole && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        <span className="font-medium text-foreground">
                                            {recipientRole === 'admin' ? stats.total_admin :
                                             recipientRole === 'checkin_staff' ? stats.total_checkin_staff :
                                             stats.total_public}
                                        </span>{' '}
                                        user(s) with role <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">{recipientRole}</Badge>
                                    </p>
                                )}
                            </div>
                        )}

                        {recipientType === 'event' && (
                            <div className="max-w-xs">
                                <Label>Select Event</Label>
                                <Select value={recipientEventId?.toString() ?? ''} onValueChange={v => setRecipientEventId(Number(v))}>
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue placeholder="Choose an event..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map(e => (
                                            <SelectItem key={e.id} value={e.id.toString()}>
                                                {e.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {recipientEventId && (() => {
                                    const evt = events.find(e => e.id === recipientEventId);
                                    return (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            <span className="font-medium text-foreground">{evt?.registrants_count ?? 0}</span>{' '}
                                            confirmed/attended registrant(s) of <strong>{evt?.title}</strong>
                                        </p>
                                    );
                                })()}
                            </div>
                        )}

                        {recipientType === 'individual' && (
                            <UserPicker
                                selectedUsers={selectedUsers}
                                setSelectedUsers={setSelectedUsers}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Notification content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Notification</CardTitle>
                        <CardDescription>Write your message</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="notify-title">Title <span className="text-destructive">*</span></Label>
                            <Input
                                id="notify-title"
                                placeholder="Notification title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                maxLength={255}
                                className="mt-1.5"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">{title.length}/255</p>
                        </div>

                        <div>
                            <Label htmlFor="notify-body">Body <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="notify-body"
                                placeholder="Write your notification message..."
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                rows={6}
                                className="mt-1.5 resize-y"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notify-url">Action URL <span className="text-muted-foreground">(optional)</span></Label>
                            <Input
                                id="notify-url"
                                placeholder="/events/some-event"
                                value={actionUrl}
                                onChange={e => setActionUrl(e.target.value)}
                                maxLength={500}
                                className="mt-1.5"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">
                                Where users will be taken when they click the notification. Leave empty for no action.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar summary */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Recipients:</span>
                            <span className="font-medium ml-auto">{recipientCount()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium ml-auto">{recipientLabel()}</span>
                        </div>
                        {title && (
                            <div className="flex items-start gap-2 text-sm pt-2 border-t">
                                <Bell className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-medium truncate">{title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">{body || 'No body text'}</p>
                                    {actionUrl && (
                                        <p className="text-[10px] text-brand mt-1 truncate">{actionUrl}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button
                    className="w-full"
                    disabled={!canSend || sending}
                    onClick={() => setConfirmOpen(true)}
                >
                    {sending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                    {sending ? 'Sending...' : `Send to ${recipientCount()} user(s)`}
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Send</DialogTitle>
                        <DialogDescription>
                            This will send the notification to <strong>{recipientCount()} user(s)</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                        <p><strong>Title:</strong> {title}</p>
                        <p><strong>Recipients:</strong> {recipientLabel()}</p>
                        {actionUrl && <p><strong>Action URL:</strong> {actionUrl}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}><Send className="w-4 h-4 mr-1.5" /> Send</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserPicker({ selectedUsers, setSelectedUsers }: { selectedUsers: UserSearch[]; setSelectedUsers: (u: UserSearch[]) => void }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const searchUsers = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/notify/search-users', { params: { q: q || undefined } });
            setResults(res.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        searchUsers('');
    }, [searchUsers]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchUsers(search), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search, searchUsers]);

    const selectedEmails = new Set(selectedUsers.map(u => u.email));

    const toggleUser = (u: UserSearch) => {
        if (selectedEmails.has(u.email)) {
            setSelectedUsers(selectedUsers.filter(s => s.email !== u.email));
        } else {
            setSelectedUsers([...selectedUsers, u]);
        }
    };

    const selectAllVisible = () => {
        if (!results) return;
        const visible = results.data.filter(u => u.email);
        const newEmails = new Set(selectedUsers.map(u => u.email));
        visible.forEach(u => newEmails.add(u.email));
        const merged = [...selectedUsers];
        visible.forEach(u => {
            if (!selectedEmails.has(u.email)) merged.push(u);
        });
        setSelectedUsers(merged);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            )}

            {!loading && results && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVisible}
                        className="text-xs h-7"
                    >
                        Select all visible
                    </Button>

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {results.data.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
                        ) : (
                            results.data.map(u => {
                                const isSelected = selectedEmails.has(u.email);
                                return (
                                    <label
                                        key={u.email}
                                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                            isSelected ? 'bg-brand/5' : ''
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleUser(u)}
                                            className="rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                        {u.role && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                                {u.role}
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>

                    {results.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            {Array.from({ length: results.last_page }, (_, i) => (
                                <Button
                                    key={i}
                                    variant={results.current_page === i + 1 ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 w-7 p-0 text-xs"
                                    onClick={() => {
                                        axios.get('/admin/notify/search-users', {
                                            params: { q: search || undefined, page: i + 1 },
                                        }).then(res => setResults(res.data));
                                    }}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                    {selectedUsers.map(u => (
                        <Badge key={u.email} variant="secondary" className="gap-1 pr-1">
                            <span className="text-[11px]">{u.name ?? u.email}</span>
                            <button
                                onClick={() => toggleUser(u)}
                                className="hover:bg-muted rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function SentTab() {
    const [sent, setSent] = useState<PaginatedSent | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<SentNotification | null>(null);

    const fetchSent = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await axios.get('/admin/notify/sent', { params: { page } });
            setSent(res.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSent(); }, [fetchSent]);

    const fetchDetail = async (id: number) => {
        try {
            const res = await axios.get(`/admin/notify/sent/${id}`);
            setSelected(res.data);
        } catch {
            // silent
        }
    };

    if (selected) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <CardTitle className="text-lg">{selected.title}</CardTitle>
                        <CardDescription>
                            Sent to {selected.recipient_count} user(s) — {selected.recipient_label}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Message</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{selected.body}</p>
                    </div>
                    {selected.action_url && (
                        <div>
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Action URL</Label>
                            <p className="text-sm text-brand mt-1">{selected.action_url}</p>
                        </div>
                    )}
                    <Separator />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Sent by: <strong className="text-foreground">{selected.user?.name ?? 'Unknown'}</strong></span>
                        <span><Clock className="w-3 h-3 inline mr-0.5" />{new Date(selected.created_at).toLocaleString()}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Sent Notifications</CardTitle>
                <CardDescription>History of notification broadcasts</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : !sent || sent.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Inbox className="w-10 h-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">No notifications sent yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Sent notification broadcasts will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sent.data.map(item => (
                            <button
                                key={item.id}
                                onClick={() => fetchDetail(item.id)}
                                className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{item.body}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {item.recipient_count} users
                                    </Badge>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {sent && sent.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {Array.from({ length: sent.last_page }, (_, i) => (
                            <Button
                                key={i}
                                variant={sent.current_page === i + 1 ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 w-7 p-0 text-xs"
                                onClick={() => fetchSent(i + 1)}
                            >
                                {i + 1}
                            </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
