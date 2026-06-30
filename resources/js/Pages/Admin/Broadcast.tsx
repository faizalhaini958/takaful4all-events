import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Mail, Search, X, Send, Users, Building2, CalendarDays, User, Loader2, Eye, EyeOff, Bold, Italic, Link as LinkIcon, List, AlertTriangle, Check, Filter, Clock, Inbox, ChevronLeft, Hash, Image as ImageIcon, Upload, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Separator } from '@/Components/ui/separator';
import type { Media } from '@/types';

interface Event {
    id: number;
    title: string;
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
    total_editor: number;
    total_checkin_staff: number;
    total_company: number;
    total_public: number;
    total_event_registrants: number;
}

interface SentEmail {
    id: number;
    subject: string;
    body: string;
    recipient_type: string;
    recipient_label: string;
    recipient_count: number;
    created_at: string;
    user?: { id: number; name: string };
}

interface PaginatedSentEmails {
    data: SentEmail[];
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

function formatCount(n: number): string {
    return n.toLocaleString();
}

function recipientTypeIcon(type: string) {
    switch (type) {
        case 'all': return Users;
        case 'role': return Building2;
        case 'event': return CalendarDays;
        case 'individual': return User;
        default: return Users;
    }
}

export default function MailPage({ events, roles, stats }: Props) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipientType, setRecipientType] = useState<RecipientType>('all');
    const [recipientRole, setRecipientRole] = useState('');
    const [recipientEventId, setRecipientEventId] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<UserSearch[]>([]);
    const [sending, setSending] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [insertTag, setInsertTag] = useState('');
    const bodyRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageTab, setImageTab] = useState<'upload' | 'browse'>('upload');
    const [browseMedia, setBrowseMedia] = useState<Media[]>([]);
    const [browsePage, setBrowsePage] = useState(1);
    const [browseHasMore, setBrowseHasMore] = useState(false);
    const [browseLoading, setBrowseLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [imageDragOver, setImageDragOver] = useState(false);
    const imageFileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose');
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
    const [sentLoading, setSentLoading] = useState(false);
    const [sentPage, setSentPage] = useState(1);
    const [sentHasMore, setSentHasMore] = useState(false);
    const [sentTotal, setSentTotal] = useState(0);
    const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);

    const [userList, setUserList] = useState<UserSearch[]>([]);
    const [userPage, setUserPage] = useState(1);
    const [userHasMore, setUserHasMore] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userEventFilter, setUserEventFilter] = useState('__all__');
    const [eventDropdownSearch, setEventDropdownSearch] = useState('');

    const [allUsersList, setAllUsersList] = useState<UserSearch[]>([]);
    const [allUsersPage, setAllUsersPage] = useState(1);
    const [allUsersHasMore, setAllUsersHasMore] = useState(false);
    const [allUsersLoading, setAllUsersLoading] = useState(false);
    const [allUsersSearch, setAllUsersSearch] = useState('');

    const [eventRegistrants, setEventRegistrants] = useState<UserSearch[]>([]);
    const [eventRegPage, setEventRegPage] = useState(1);
    const [eventRegHasMore, setEventRegHasMore] = useState(false);
    const [eventRegFetching, setEventRegFetching] = useState(false);

    const fetchUsers = useCallback(async (page: number, search: string, eventId: string, append: boolean) => {
        setUserLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            if (search.trim()) params.set('q', search.trim());
            if (eventId && eventId !== '__all__') params.set('event_id', eventId);

            const res = await fetch(`/admin/broadcast/search-users?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data: PaginatedUsers = await res.json();
            const filtered = data.data.filter(u => !selectedUsers.find(s => s.email === u.email));

            if (append) {
                setUserList(prev => [...prev, ...filtered]);
            } else {
                setUserList(filtered);
            }
            setUserPage(data.current_page);
            setUserHasMore(data.current_page < data.last_page);
        } catch {
            if (!append) setUserList([]);
        } finally {
            setUserLoading(false);
        }
    }, [selectedUsers]);

    const fetchAllUsers = useCallback(async (page: number, search: string, append: boolean) => {
        setAllUsersLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            if (search.trim()) params.set('q', search.trim());

            const res = await fetch(`/admin/broadcast/search-users?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data: PaginatedUsers = await res.json();

            if (append) {
                setAllUsersList(prev => [...prev, ...data.data]);
            } else {
                setAllUsersList(data.data);
            }
            setAllUsersPage(data.current_page);
            setAllUsersHasMore(data.current_page < data.last_page);
        } catch {
            if (!append) setAllUsersList([]);
        } finally {
            setAllUsersLoading(false);
        }
    }, []);

    const fetchEventRegistrants = useCallback(async (eventId: string, page: number, append: boolean) => {
        if (!eventId) return;
        setEventRegFetching(true);
        try {
            const params = new URLSearchParams();
            params.set('event_id', eventId);
            params.set('page', String(page));

            const res = await fetch(`/admin/broadcast/search-users?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data: PaginatedUsers = await res.json();

            if (append) {
                setEventRegistrants(prev => [...prev, ...data.data]);
            } else {
                setEventRegistrants(data.data);
            }
            setEventRegPage(data.current_page);
            setEventRegHasMore(data.current_page < data.last_page);
        } catch {
            if (!append) setEventRegistrants([]);
        } finally {
            setEventRegFetching(false);
        }
    }, []);

    const fetchSentEmails = useCallback(async (page: number, append: boolean) => {
        setSentLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));

            const res = await fetch(`/admin/broadcast/sent?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data: PaginatedSentEmails = await res.json();

            if (append) {
                setSentEmails(prev => [...prev, ...data.data]);
            } else {
                setSentEmails(data.data);
            }
            setSentPage(data.current_page);
            setSentHasMore(data.current_page < data.last_page);
            setSentTotal(data.total);
        } catch {
            if (!append) setSentEmails([]);
        } finally {
            setSentLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'sent') {
            fetchSentEmails(1, false);
        }
    }, [activeTab, fetchSentEmails]);

    const loadMoreSent = () => {
        fetchSentEmails(sentPage + 1, true);
    };

    const viewSentEmail = async (id: number) => {
        try {
            const res = await fetch(`/admin/broadcast/sent/${id}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data: SentEmail = await res.json();
            setSelectedEmail(data);
        } catch {
            // ignore
        }
    };

    const formatDate = (dateStr: string): string => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    useEffect(() => {
        if (recipientType === 'individual') {
            fetchUsers(1, userSearch, userEventFilter, false);
        }
    }, [recipientType, userSearch, userEventFilter]);

    useEffect(() => {
        if (recipientType === 'event' && recipientEventId) {
            fetchEventRegistrants(recipientEventId, 1, false);
        }
    }, [recipientType, recipientEventId, fetchEventRegistrants]);

    const loadMore = () => {
        fetchUsers(userPage + 1, userSearch, userEventFilter, true);
    };

    useEffect(() => {
        if (recipientType === 'all') {
            fetchAllUsers(1, allUsersSearch, false);
        }
    }, [recipientType, allUsersSearch]);

    const loadMoreAllUsers = () => {
        fetchAllUsers(allUsersPage + 1, allUsersSearch, true);
    };

    const toggleUser = (user: UserSearch) => {
        if (selectedUsers.find(u => u.email === user.email)) {
            setSelectedUsers(prev => prev.filter(u => u.email !== user.email));
        } else {
            setSelectedUsers(prev => [...prev, user]);
        }
    };

    const removeUser = (email: string) => {
        setSelectedUsers(prev => prev.filter(u => u.email !== email));
    };

    const selectAllVisible = () => {
        const newIds = userList.filter(u => !selectedUsers.find(s => s.email === u.email));
        setSelectedUsers(prev => [...prev, ...newIds]);
    };

    const deselectAllVisible = () => {
        setSelectedUsers(prev => prev.filter(u => !userList.some(v => v.email === u.email)));
    };

    const getCaretRangeWithin = (el: HTMLElement): Range => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (el.contains(range.commonAncestorContainer)) return range;
        }
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        return range;
    };

    const applyFormatting = (command: string, wrapper?: string) => {
        const el = bodyRef.current;
        if (!el) return;
        el.focus();

        if (command === 'bold' || command === 'italic') {
            document.execCommand(command);
            setBody(el.innerHTML);
            return;
        }

        if (command === 'insertUnorderedList') {
            document.execCommand(command);
            setBody(el.innerHTML);
            return;
        }

        if (wrapper) {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const range = selection.getRangeAt(0);
            const selectedText = range.toString() || 'text';
            const replacement = wrapper.replace('$1', selectedText);

            const span = document.createElement('span');
            span.innerHTML = replacement;
            range.deleteContents();
            range.insertNode(span);

            // Move cursor after inserted node
            range.setStartAfter(span);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            setBody(el.innerHTML);
        }
    };

    const openLinkDialog = () => {
        const el = bodyRef.current;
        if (!el) return;
        el.focus();
        savedRangeRef.current = getCaretRangeWithin(el).cloneRange();
        setLinkUrl('');
        setLinkDialogOpen(true);
    };

    const insertLink = () => {
        const el = bodyRef.current;
        const range = savedRangeRef.current;
        if (!el || !range) return;

        let url = linkUrl.trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('#')) {
            url = `https://${url}`;
        }

        const selectedText = range.toString() || url;
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.textContent = selectedText;

        el.focus();
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        range.deleteContents();
        range.insertNode(anchor);

        range.setStartAfter(anchor);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);

        setBody(el.innerHTML);
        setLinkDialogOpen(false);
    };

    const insertPersonalization = (tagName: string) => {
        if (!tagName) return;
        const el = bodyRef.current;
        if (!el) return;
        el.focus();

        const tag = `{{${tagName}}}`;
        const range = getCaretRangeWithin(el);
        const selection = window.getSelection();
        if (!selection) return;
        range.deleteContents();

        const textNode = document.createTextNode(tag);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        setBody(el.innerHTML);
        setInsertTag('');
    };

    const fetchBrowseMedia = useCallback(async (page: number, append: boolean) => {
        setBrowseLoading(true);
        try {
            const res = await fetch(`/admin/media?page=${page}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            if (append) {
                setBrowseMedia(prev => [...prev, ...data.media.data]);
            } else {
                setBrowseMedia(data.media.data);
            }
            setBrowsePage(data.media.current_page);
            setBrowseHasMore(data.media.current_page < data.media.last_page);
        } catch {
            if (!append) setBrowseMedia([]);
        } finally {
            setBrowseLoading(false);
        }
    }, []);

    const openImageDialog = () => {
        setImageTab('upload');
        setImageUploadError(null);
        setImageDialogOpen(true);
        fetchBrowseMedia(1, false);
    };

    const handleImageFileDrop = (files: FileList | null) => {
        if (files?.[0]) uploadImageFile(files[0]);
    };

    const uploadImageFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setImageUploadError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setImageUploadError('File must be smaller than 5 MB.');
            return;
        }

        setImageUploadError(null);
        setImageUploading(true);

        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await axios.post<{ media: Media }>('/admin/media', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            insertImageAtCursor(data.media);
            setImageDialogOpen(false);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Upload failed. Please try again.';
            setImageUploadError(msg);
        } finally {
            setImageUploading(false);
        }
    };

    const removeImageWrapper = (wrapper: HTMLDivElement) => {
        wrapper.remove();
        if (bodyRef.current) {
            setBody(bodyRef.current.innerHTML);
        }
    };

    const insertImageAtCursor = (media: Media) => {
        const el = bodyRef.current;
        if (!el) return;
        el.focus();

        const wrapper = document.createElement('div');
        wrapper.setAttribute('contenteditable', 'false');
        wrapper.className = 'group/image relative inline-block max-w-full not-prose';

        const img = document.createElement('img');
        img.src = media.url;
        img.setAttribute('data-media-id', String(media.id));
        if (media.title) img.alt = media.title;
        img.className = 'max-w-full h-auto rounded-lg border border-border';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm';
        deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        deleteBtn.title = 'Remove image';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeImageWrapper(wrapper);
        });

        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);

        const range = getCaretRangeWithin(el);
        range.deleteContents();
        range.insertNode(wrapper);

        const br = document.createElement('br');
        wrapper.after(br);

        range.setStartAfter(br);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        setBody(el.innerHTML);
    };

    const getRecipientCount = (): number => {
        switch (recipientType) {
            case 'all': return stats.total_users;
            case 'role': {
                const roleKey = `total_${recipientRole}` as keyof Stats;
                return (stats[roleKey] as number) ?? 0;
            }
            case 'event': {
                const ev = events.find(e => String(e.id) === recipientEventId);
                return ev?.registrants_count ?? 0;
            }
            case 'individual': return selectedUsers.length;
            default: return 0;
        }
    };

    const getRecipientLabel = (): string => {
        switch (recipientType) {
            case 'all': return `${formatCount(stats.total_users)} users (all roles)`;
            case 'role': {
                const r = roles.find(r => r.value === recipientRole);
                return r ? r.label : 'Select a role';
            }
            case 'event': {
                const ev = events.find(e => String(e.id) === recipientEventId);
                return ev ? `Registrants of "${ev.title}"` : 'Select an event';
            }
            case 'individual': return selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'No users selected';
        }
    };

    const canSend = (): boolean => {
        const hasSubject = subject.trim().length > 0;
        const bodyText = body.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        const hasBody = bodyText.length > 0;
        if (!hasSubject || !hasBody) return false;
        switch (recipientType) {
            case 'role': return !!recipientRole;
            case 'event': return !!recipientEventId;
            case 'individual': return selectedUsers.length > 0;
            default: return true;
        }
    };

    const doSend = () => {
        setConfirmOpen(false);
        setSending(true);
        router.post('/admin/broadcast', {
            subject,
            body,
            recipient_type: recipientType,
            ...(recipientType === 'role' ? { recipient_role: recipientRole } : {}),
            ...(recipientType === 'event' ? { recipient_event_id: recipientEventId } : {}),
            ...(recipientType === 'individual' ? { recipient_emails: selectedUsers.map(u => u.email) } : {}),
        }, {
            onFinish: () => setSending(false),
            onSuccess: () => {
                setSubject('');
                setBody('');
                setShowPreview(false);
                if (bodyRef.current) bodyRef.current.innerHTML = '';
            },
        });
    };

    const previewHtml = body
        .replace(/{{name}}/g, '<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;font-size:13px;">John Doe</span>')
        .replace(/{{email}}/g, '<span style="background:#e0f2fe;padding:1px 4px;border-radius:3px;font-size:13px;">john@example.com</span>')
        .replace(/\{\{(\w+)\}\}/g, '<span style="background:#fff3cd;padding:1px 4px;border-radius:3px;font-size:13px;">$1</span>');

    const recipientCount = getRecipientCount();
    const recipientLabel = getRecipientLabel();

    const filteredDropdownEvents = events.filter(ev =>
        ev.title.toLowerCase().includes(eventDropdownSearch.trim().toLowerCase())
    );

    const getOptionPreviewBadge = (type: RecipientType): string | null => {
        switch (type) {
            case 'all': return formatCount(stats.total_users);
            case 'role': return `${roles.length} roles`;
            case 'event': return `${events.length} events`;
            case 'individual': return selectedUsers.length > 0 ? formatCount(selectedUsers.length) : null;
            default: return null;
        }
    };

    return (
        <AdminLayout>
            <Head>
                <title>Mail | Admin</title>
            </Head>

            <div className="mx-auto max-w-6xl py-6 px-4 sm:px-6 lg:px-8 space-y-5">
                {/* ===== HEADER ===== */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/10">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Mail</h1>
                            <p className="text-sm text-muted-foreground">
                                {activeTab === 'compose' ? 'Compose and send broadcast emails' : 'Sent broadcast history'}
                            </p>
                        </div>
                    </div>

                    {/* Tabs + actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="flex rounded-lg border bg-muted/40 p-0.5">
                            <button
                                type="button"
                                onClick={() => { setActiveTab('compose'); setSelectedEmail(null); }}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'compose'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                            >
                                <Send className="w-3.5 h-3.5" />
                                Compose
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('sent')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                    activeTab === 'sent'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }`}
                            >
                                <Inbox className="w-3.5 h-3.5" />
                                Sent
                                {sentTotal > 0 && (
                                    <span className="ml-0.5 text-[10px] font-semibold bg-muted-foreground/15 rounded-full px-1.5 py-px">
                                        {sentTotal}
                                    </span>
                                )}
                            </button>
                        </div>
                        {activeTab === 'compose' && (
                            <Button
                                size="sm"
                                onClick={() => setConfirmOpen(true)}
                                disabled={!canSend() || sending}
                                className="gap-1.5 shadow-sm"
                            >
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                                ) : (
                                    <><Send className="w-4 h-4" />Send{recipientCount > 0 ? ` (${recipientCount})` : ''}</>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* ===== SENT LIST ===== */}
                {activeTab === 'sent' && !selectedEmail && (
                    <Card className="overflow-hidden border-muted-foreground/10">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Inbox className="w-4 h-4 text-muted-foreground" />
                                    Sent Emails
                                </CardTitle>
                                <CardDescription>
                                    {sentTotal > 0 ? `${sentTotal} broadcast(s) sent` : 'No emails sent yet'}
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setActiveTab('compose')}>
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                New
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {sentLoading && sentEmails.length === 0 ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sentEmails.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Inbox className="w-7 h-7 opacity-30" />
                                    </div>
                                    <p className="text-sm font-medium">No sent emails yet</p>
                                    <p className="text-xs mt-1">Compose your first broadcast to get started.</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setActiveTab('compose')}
                                        className="mt-2"
                                    >
                                        Compose an email
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-border/50">
                                        {sentEmails.map((email, idx) => {
                                            const TypeIcon = recipientTypeIcon(email.recipient_type);
                                            return (
                                                <button
                                                    key={email.id}
                                                    type="button"
                                                    onClick={() => viewSentEmail(email.id)}
                                                    className={`w-full text-left px-5 py-4 hover:bg-accent/40 transition-colors flex items-start gap-4 group ${
                                                        idx === 0 ? 'bg-primary/5 hover:bg-primary/10' : ''
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors group-hover:ring-2 group-hover:ring-primary/20 ${
                                                        idx === 0 ? 'bg-primary/15' : 'bg-muted'
                                                    }`}>
                                                        <TypeIcon className={`w-4 h-4 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <h4 className={`text-sm font-semibold truncate ${idx === 0 ? '' : ''}`}>
                                                                    {email.subject}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                                    To: {email.recipient_label}
                                                                </p>
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground flex-shrink-0 flex items-center gap-1 pt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDate(email.created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                                                <Hash className="w-2.5 h-2.5" />
                                                                {email.recipient_count.toLocaleString()}
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground capitalize">
                                                                {email.recipient_type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronLeft className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-2 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {sentHasMore && (
                                        <button
                                            type="button"
                                            onClick={loadMoreSent}
                                            disabled={sentLoading}
                                            className="w-full px-3 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-t flex items-center justify-center gap-1.5"
                                        >
                                            {sentLoading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : null}
                                            Load more
                                        </button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ===== SENT DETAIL ===== */}
                {activeTab === 'sent' && selectedEmail && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEmail(null)}
                            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Sent
                        </Button>

                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1.5 min-w-0">
                                        <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                            <span>To: <strong className="text-foreground/80">{selectedEmail.recipient_label}</strong></span>
                                            <span className="text-border">·</span>
                                            <Badge variant="secondary" className="text-[10px] font-medium">
                                                {selectedEmail.recipient_count.toLocaleString()} recipients
                                            </Badge>
                                            <span className="text-border">·</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(selectedEmail.created_at).toLocaleString('en-MY', {
                                                    month: 'short', day: 'numeric', year: 'numeric',
                                                    hour: 'numeric', minute: '2-digit',
                                                })}
                                            </span>
                                            {selectedEmail.user && (
                                                <>
                                                    <span className="text-border">·</span>
                                                    <span>Sent by {selectedEmail.user.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-[10px] flex-shrink-0">
                                        {selectedEmail.recipient_type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Separator className="mb-5" />
                                <div
                                    className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-0.5 [&_p]:mb-2 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ===== COMPOSE ===== */}
                {activeTab === 'compose' && (
                <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
                    <div className="space-y-5">
                        {/* Recipient Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        Recipients
                                    </CardTitle>
                                    {recipientCount > 0 && (
                                        <Badge variant="secondary" className="text-[10px] font-medium gap-1">
                                            <Hash className="w-2.5 h-2.5" />
                                            {recipientCount}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {RECIPIENT_OPTIONS.map(opt => {
                                        const active = recipientType === opt.value;
                                        const previewBadge = getOptionPreviewBadge(opt.value);
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setRecipientType(opt.value)}
                                                className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                                                    active
                                                        ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]'
                                                        : 'border-transparent bg-muted/40 hover:bg-muted hover:border-muted-foreground/15 text-muted-foreground hover:scale-[1.01]'
                                                }`}
                                            >
                                                <opt.icon className={`w-5 h-5 transition-colors ${active ? 'text-primary' : ''}`} />
                                                <span className="text-xs font-semibold leading-tight">{opt.label}</span>
                                                <span className="text-[10px] opacity-60 leading-tight">{opt.description}</span>
                                                {previewBadge && (
                                                    <span className={`text-[10px] font-medium px-1.5 py-px rounded-full ${
                                                        active ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/10'
                                                    }`}>
                                                        {previewBadge}
                                                    </span>
                                                )}
                                                {active && (
                                                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-3 pt-1">
                                    {recipientType === 'all' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search name or email..."
                                                    value={allUsersSearch}
                                                    onChange={e => setAllUsersSearch(e.target.value)}
                                                    className="pl-9 h-9 text-sm"
                                                />
                                            </div>

                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                                    <span className="text-xs text-muted-foreground">
                                                        Showing {allUsersList.length} of {formatCount(stats.total_users)} user(s)
                                                    </span>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {allUsersLoading && allUsersList.length === 0 ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : allUsersList.length === 0 ? (
                                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                                            No users found
                                                        </div>
                                                    ) : (
                                                        allUsersList.map(user => (
                                                            <div
                                                                key={user.email}
                                                                className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b last:border-b-0"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-sm font-medium truncate">{user.name}</div>
                                                                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                                </div>
                                                                <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                                                                    {user.role}
                                                                </Badge>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                {allUsersHasMore && (
                                                    <button
                                                        type="button"
                                                        onClick={loadMoreAllUsers}
                                                        disabled={allUsersLoading}
                                                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-t flex items-center justify-center gap-1.5"
                                                    >
                                                        {allUsersLoading ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : null}
                                                        Load more users
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {recipientType === 'role' && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                                            <Select value={recipientRole} onValueChange={setRecipientRole}>
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder="Choose a role..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map(r => (
                                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {recipientType === 'event' && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                                            <Select
                                                value={recipientEventId}
                                                onValueChange={setRecipientEventId}
                                                onOpenChange={open => { if (!open) setEventDropdownSearch(''); }}
                                            >
                                                <SelectTrigger className="h-9 text-sm">
                                                    <SelectValue placeholder="Choose an event..." />
                                                </SelectTrigger>
                                                <SelectContent className="p-0">
                                                    <div
                                                        className="sticky top-0 z-10 bg-popover p-1.5 border-b"
                                                        onKeyDown={e => e.stopPropagation()}
                                                    >
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                            <Input
                                                                autoFocus
                                                                placeholder="Search events..."
                                                                value={eventDropdownSearch}
                                                                onChange={e => setEventDropdownSearch(e.target.value)}
                                                                className="pl-7 h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-1">
                                                        {filteredDropdownEvents.length === 0 ? (
                                                            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                                                No events match "{eventDropdownSearch}"
                                                            </div>
                                                        ) : (
                                                            filteredDropdownEvents.map(ev => (
                                                                <SelectItem key={ev.id} value={String(ev.id)}>
                                                                    <span className="truncate">{ev.title}</span>
                                                                    {ev.registrants_count > 0 && (
                                                                        <span className="ml-2 text-[10px] text-muted-foreground">
                                                                            ({ev.registrants_count})
                                                                        </span>
                                                                    )}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </div>
                                                </SelectContent>
                                            </Select>

                                            {recipientEventId && (
                                                <div className="mt-3 border rounded-lg overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                                        <span className="text-xs text-muted-foreground">
                                                            {eventRegFetching && eventRegistrants.length === 0
                                                                ? 'Loading...'
                                                                : `${eventRegistrants.length} registrant(s)`}
                                                        </span>
                                                    </div>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        {eventRegFetching && eventRegistrants.length === 0 ? (
                                                            <div className="flex items-center justify-center py-12">
                                                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                            </div>
                                                        ) : eventRegistrants.length === 0 ? (
                                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                                No registrants found
                                                            </div>
                                                        ) : (
                                                            eventRegistrants.map(reg => (
                                                                <div
                                                                    key={reg.email}
                                                                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 border-b last:border-b-0"
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-sm font-medium truncate">{reg.name}</div>
                                                                        <div className="text-xs text-muted-foreground truncate">{reg.email}</div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                                                                        {reg.role || 'Guest'}
                                                                    </Badge>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    {eventRegHasMore && (
                                                        <button
                                                            type="button"
                                                            onClick={() => fetchEventRegistrants(recipientEventId, eventRegPage + 1, true)}
                                                            disabled={eventRegFetching}
                                                            className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-t flex items-center justify-center gap-1.5"
                                                        >
                                                            {eventRegFetching ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : null}
                                                            Load more
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {recipientType === 'individual' && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                                            {selectedUsers.length > 0 && (
                                                <div className="border rounded-lg bg-muted/20">
                                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b">
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {selectedUsers.length} selected
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedUsers([])}
                                                            className="text-xs text-muted-foreground hover:text-destructive font-medium"
                                                        >
                                                            Clear all
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 p-2 max-h-24 overflow-y-auto">
                                                        {selectedUsers.map(user => (
                                                            <Badge key={user.email} variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1 animate-in zoom-in-95 duration-150">
                                                                <span className="max-w-[160px] truncate">{user.name}</span>
                                                                <button type="button" onClick={() => removeUser(user.email!)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search name or email..."
                                                        value={userSearch}
                                                        onChange={e => setUserSearch(e.target.value)}
                                                        className="pl-9 h-9 text-sm"
                                                    />
                                                </div>
                                                <Select value={userEventFilter} onValueChange={setUserEventFilter}>
                                                    <SelectTrigger className="h-9 text-sm w-full sm:w-[180px]">
                                                        <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                                        <SelectValue placeholder="All events" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__all__">All events</SelectItem>
                                                        {events.map(ev => (
                                                            <SelectItem key={ev.id} value={String(ev.id)}>{ev.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                                    <span className="text-xs text-muted-foreground">
                                                        {userList.length > 0 ? `Showing ${userList.length} user(s)` : 'No users found'}
                                                    </span>
                                                    {userList.length > 0 && (() => {
                                                        const allVisibleSelected = userList.every(u => selectedUsers.some(s => s.email === u.email));
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => allVisibleSelected ? deselectAllVisible() : selectAllVisible()}
                                                                className="flex items-center gap-1.5 text-xs text-primary font-medium select-none"
                                                            >
                                                                <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                    allVisibleSelected ? 'bg-primary border-primary' : 'border-primary/40'
                                                                }`}>
                                                                    {allVisibleSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                                </span>
                                                                Select all visible
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {userLoading && userList.length === 0 ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                                        </div>
                                                    ) : userList.length === 0 ? (
                                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                                            {userSearch || userEventFilter !== '__all__' ? 'No users match your filters' : 'Type to search or select an event filter'}
                                                        </div>
                                                    ) : (
                                                        userList.map(user => {
                                                            const isSelected = selectedUsers.some(s => s.email === user.email);
                                                            return (
                                                                <button
                                                                    key={user.email}
                                                                    type="button"
                                                                    onClick={() => toggleUser(user)}
                                                                    className={`group w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                                                                        isSelected ? 'bg-primary/5' : ''
                                                                    }`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                        isSelected
                                                                            ? 'bg-primary border-primary'
                                                                            : 'border-muted-foreground/50 group-hover:border-primary/60 group-hover:bg-primary/5'
                                                                    }`}>
                                                                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-sm font-medium truncate">{user.name}</div>
                                                                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                                    </div>
                                                                    <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                                                                        {user.role || 'Guest'}
                                                                    </Badge>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                {userHasMore && (
                                                    <button
                                                        type="button"
                                                        onClick={loadMore}
                                                        disabled={userLoading}
                                                        className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-t flex items-center justify-center gap-1.5"
                                                    >
                                                        {userLoading ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : null}
                                                        Load more users
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/40 text-sm border border-transparent">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-muted-foreground truncate">{recipientLabel}</span>
                                    {recipientCount > 0 && (
                                        <Badge variant="outline" className="text-[10px] ml-auto flex-shrink-0">
                                            {recipientCount}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compose Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        Compose
                                    </CardTitle>
                                    <div className="flex items-center gap-0.5">
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormatting('bold')} title="Bold">
                                            <Bold className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormatting('italic')} title="Italic">
                                            <Italic className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={openLinkDialog} title="Link">
                                            <LinkIcon className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={openImageDialog} title="Insert Image">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormatting('insertUnorderedList')} title="List">
                                            <List className="w-3.5 h-3.5" />
                                        </Button>
                                        <Separator orientation="vertical" className="h-5 mx-1" />
                                        <Select value={insertTag} onValueChange={v => { setInsertTag(''); insertPersonalization(v); }}>
                                            <SelectTrigger className="h-7 text-[11px] gap-1 px-2 w-auto border-0 bg-muted hover:bg-muted/80">
                                                <span className="text-muted-foreground">Insert</span>
                                            </SelectTrigger>
                                            <SelectContent align="end">
                                                <SelectItem value="name">Recipient Name</SelectItem>
                                                <SelectItem value="email">Recipient Email</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Separator orientation="vertical" className="h-5 mx-1" />
                                        <Button
                                            type="button"
                                            variant={showPreview ? 'secondary' : 'ghost'}
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setShowPreview(!showPreview)}
                                            title={showPreview ? 'Hide preview' : 'Show preview'}
                                        >
                                            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    placeholder="Email subject..."
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="border-0 border-b rounded-none px-0 text-base font-semibold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-primary"
                                    required
                                />
                                <div
                                    ref={bodyRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={e => setBody(e.currentTarget.innerHTML)}
                                    onFocus={() => {
                                        if (bodyRef.current && bodyRef.current.innerHTML === '') {
                                            // ensure empty state is clean
                                        }
                                    }}
                                    data-placeholder="Write your message...&#10;&#10;Tip: Use {{name}} to insert the recipient's name."
                                    className="resize-y min-h-[260px] border-0 rounded-none px-0 focus:outline-none text-sm leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-0.5 [&_p]:mb-2"
                                    role="textbox"
                                    aria-multiline="true"
                                    style={{ outline: 'none' }}
                                />
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <p className="text-[11px] text-muted-foreground">
                                        {(() => {
                                            const textLength = body.replace(/<[^>]*>/g, '').length;
                                            return textLength > 0
                                                ? `${textLength.toLocaleString()} characters`
                                                : 'Start typing to compose your email';
                                        })()}
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={() => setConfirmOpen(true)}
                                        disabled={!canSend() || sending}
                                        className="gap-1.5"
                                    >
                                        {sending ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                                        ) : (
                                            <><Send className="w-4 h-4" />Send{recipientCount > 0 ? ` (${recipientCount})` : ''}</>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <div className="lg:sticky lg:top-20 self-start animate-in fade-in slide-in-from-right-3 duration-200">
                            <Card className="border-primary/10">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                        Preview
                                    </CardTitle>
                                    <CardDescription>How your email will look in the inbox</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border bg-muted/30 p-4 mb-4 space-y-1">
                                        <div className="text-xs text-muted-foreground">From: Takaful4All Events</div>
                                        <div className="text-xs text-muted-foreground">To: {recipientLabel}</div>
                                        <div className="text-sm font-semibold">{subject || '(no subject)'}</div>
                                    </div>
                                    <div
                                        className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-0.5 [&_p]:mb-2"
                                        dangerouslySetInnerHTML={{
                                            __html: previewHtml || '<p class="text-muted-foreground italic">Start writing to see a preview...</p>',
                                        }}
                                    />
                                    {body.includes('{{') && (
                                        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            <span>Personalization tags will be replaced with each recipient's actual details when sent.</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Confirm dialog */}
        {activeTab === 'compose' && (
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary" />
                            Confirm Send
                        </DialogTitle>
                        <DialogDescription>
                            This email will be sent to <strong>{recipientLabel}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted-foreground w-14 text-right flex-shrink-0 pt-px">Subject:</span>
                                <span className="font-medium min-w-0 break-words">{subject}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-muted-foreground w-14 text-right flex-shrink-0 pt-px">To:</span>
                                <span className="min-w-0 break-words">{recipientLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground w-14 text-right flex-shrink-0">Count:</span>
                                <Badge variant="secondary" className="font-medium">{recipientCount || '—'}</Badge>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Emails are queued and sent individually. Large batches may take a few minutes to deliver.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</Button>
                        <Button onClick={doSend} disabled={sending} className="gap-1.5">
                            {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send to {recipientCount || ''}</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

        {/* Insert link dialog */}
        {activeTab === 'compose' && (
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-primary" />
                            Insert Link
                        </DialogTitle>
                        <DialogDescription>
                            Enter the URL to link to. It will be applied to the selected text.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') insertLink(); }}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                        <Button onClick={insertLink} disabled={!linkUrl.trim()} className="gap-1.5">
                            <LinkIcon className="w-4 h-4" />
                            Insert
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}

        {/* Insert image dialog */}
        {activeTab === 'compose' && (
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Insert Image
                        </DialogTitle>
                        <DialogDescription>
                            Upload a new image or pick one from the media library.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tabs */}
                    <div className="flex mb-4 border-b">
                        <button
                            type="button"
                            onClick={() => setImageTab('upload')}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                imageTab === 'upload'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setImageTab('browse')}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                imageTab === 'browse'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Browse Library
                        </button>
                    </div>

                    {imageTab === 'upload' ? (
                        <div className="space-y-3">
                            <div
                                onDragOver={e => { e.preventDefault(); setImageDragOver(true); }}
                                onDragLeave={() => setImageDragOver(false)}
                                onDrop={e => { e.preventDefault(); setImageDragOver(false); handleImageFileDrop(e.dataTransfer.files); }}
                                onClick={() => imageFileInputRef.current?.click()}
                                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 py-12 ${
                                    imageDragOver
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted-foreground/25 hover:border-primary/50 bg-muted/20'
                                }`}
                            >
                                {imageUploading ? (
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-sm font-medium">
                                                <span className="text-primary">Click to upload</span> or drag &amp; drop
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WebP — max 5 MB</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <input
                                ref={imageFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => handleImageFileDrop(e.target.files)}
                            />
                            {imageUploadError && (
                                <p className="text-sm text-destructive flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {imageUploadError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="-mx-2">
                            {browseLoading && browseMedia.length === 0 ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : browseMedia.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <ImageIcon className="w-10 h-10 mx-auto opacity-20 mb-3" />
                                    <p className="text-sm">No images in the library yet</p>
                                    <p className="text-xs mt-1">Upload images via the Upload tab or the Media page.</p>
                                </div>
                            ) : (
                                <div className="px-2">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto">
                                        {browseMedia.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => { insertImageAtCursor(item); setImageDialogOpen(false); }}
                                                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <img
                                                    src={item.thumbnail_url ?? item.url}
                                                    alt={item.title ?? ''}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] text-white truncate leading-tight">{item.title ?? item.url.split('/').pop()}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {browseHasMore && (
                                        <div className="flex items-center justify-between px-1 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => fetchBrowseMedia(browsePage - 1, false)}
                                                disabled={browsePage <= 1 || browseLoading}
                                                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" />
                                                Previous
                                            </button>
                                            <span className="text-xs text-muted-foreground">Page {browsePage}</span>
                                            <button
                                                type="button"
                                                onClick={() => fetchBrowseMedia(browsePage + 1, true)}
                                                disabled={!browseHasMore || browseLoading}
                                                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
                                            >
                                                Next
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </AdminLayout>
    );
}
