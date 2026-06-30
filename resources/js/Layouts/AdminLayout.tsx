import { Link, usePage, router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useState, useCallback, useRef } from 'react';
import {
    LayoutDashboard,
    CalendarDays,
    FileText,
    PenSquare,
    Image,
    Menu,
    Globe,
    UserCircle,
    LogOut,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    XCircle,
    X,
    Users,
    Ticket,
    ShoppingBag,
    ShoppingCart,
    ClipboardList,
    ClipboardCheck,
    Settings,
    BarChart2,
    Tag,
    Mail,
    ScrollText,
    MonitorPlay,
    PanelTop,
    Home,
    TicketIcon,
    UsersRound,
    Layers,
    Cog,
} from 'lucide-react';
import { type SharedProps } from '@/types';
import { ModeToggle } from '@/Components/ModeToggle';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from '@/Components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import { Separator } from '@/Components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    sub?: NavItem[];
}

interface NavSection {
    label: string;
    icon: React.ElementType;
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        label: 'Main',
        icon: Home,
        items: [
            { href: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
            { href: '/admin/analytics',  label: 'Analytics',  icon: BarChart2 },
        ],
    },
    {
        label: 'Events & Orders',
        icon: TicketIcon,
        items: [
            {
                href: '/admin/events', label: 'Events', icon: CalendarDays,
                sub: [
                    { href: '/admin/events',          label: 'All Events',       icon: CalendarDays },
                    { href: '/admin/registrations',    label: 'All Registrations', icon: ClipboardCheck },
                    { href: '/admin/tickets',          label: 'All Tickets',      icon: Ticket },
                    { href: '/admin/products',         label: 'All Products',     icon: ShoppingBag },
                ],
            },
            { href: '/admin/orders',       label: 'Orders',      icon: ShoppingCart },
            { href: '/admin/promo-codes',  label: 'Promo Codes', icon: Tag },
            { href: '/admin/reports/registrations', label: 'Reports', icon: ScrollText },
        ],
    },
    {
        label: 'Users',
        icon: UsersRound,
        items: [
            { href: '/admin/users',     label: 'Users',     icon: Users },
            { href: '/admin/broadcast', label: 'Mail', icon: Mail },
        ],
    },
    {
        label: 'Content',
        icon: Layers,
        items: [
            { href: '/admin/pages',            label: 'Pages',           icon: FileText },
            { href: '/admin/posts',            label: 'Posts',           icon: PenSquare },
            { href: '/admin/media',            label: 'Media',           icon: Image },
            { href: '/admin/banners',          label: 'Banners',         icon: MonitorPlay },
            { href: '/admin/content-banners',  label: 'Content Banners', icon: PanelTop },
            { href: '/admin/menus',            label: 'Menus',           icon: Menu },
        ],
    },
    {
        label: 'System',
        icon: Cog,
        items: [
            { href: '/admin/settings',     label: 'Settings',     icon: Settings },
            { href: '/admin/activity-log', label: 'Activity Log', icon: ClipboardList },
        ],
    },
];

const NAV_CHECKIN_STAFF: NavItem[] = [
    { href: '/admin/events', label: 'Events', icon: CalendarDays },
];

function SectionLabel({ label, icon: Icon, collapsed, onToggle }: { label: string; icon: React.ElementType; collapsed: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className="flex w-full items-center gap-2 px-2 py-1.5 group cursor-pointer select-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1"
        >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-sidebar-foreground/35 group-hover:text-sidebar-foreground/55 transition-colors" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors group-data-[collapsible=icon]:hidden">
                {label}
            </span>
            <ChevronRight className={`ml-auto h-3 w-3 flex-shrink-0 text-sidebar-foreground/25 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${collapsed ? '' : 'rotate-90'}`} />
        </button>
    );
}

function AdminSidebar({ currentPath, userRole }: { currentPath: string; userRole?: string }) {
    const isCheckinStaff = userRole === 'checkin_staff';

    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
        try {
            return JSON.parse(localStorage.getItem('admin_sidebar_collapsed') ?? '{}');
        } catch {
            return {};
        }
    });

    useEffect(() => {
        localStorage.setItem('admin_sidebar_collapsed', JSON.stringify(collapsedSections));
    }, [collapsedSections]);

    const toggleSection = useCallback((label: string) => {
        setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
    }, []);

    const renderNavItem = (item: NavItem) => {
        const active =
            currentPath === item.href ||
            (item.href !== '/admin' && currentPath.startsWith(item.href));
        const Icon = item.icon;

        if (item.sub) {
            return (
                <Collapsible
                    key={item.href}
                    asChild
                    defaultOpen={active}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} isActive={active}>
                                <Icon />
                                <span>{item.label}</span>
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {item.sub.map(sub => (
                                    <SidebarMenuSubItem key={sub.href}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={
                                                sub.href === '/admin/events'
                                                    ? (currentPath === '/admin/events' || currentPath.startsWith('/admin/events/'))
                                                    : currentPath.startsWith(sub.href)
                                            }
                                        >
                                            <Link href={sub.href}>
                                                <sub.icon className="w-3.5 h-3.5" />
                                                <span>{sub.label}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            );
        }

        return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                    <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isCheckinStaff ? '/admin/events' : '/admin'}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <LayoutDashboard className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold text-sidebar-foreground">Takaful4All</span>
                                    <span className="text-xs text-sidebar-foreground/60">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {isCheckinStaff ? (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {NAV_CHECKIN_STAFF.map(item => renderNavItem(item))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    NAV_SECTIONS.map(section => {
                        const collapsed = collapsedSections[section.label] ?? false;
                        return (
                            <SidebarGroup key={section.label}>
                                <SectionLabel
                                    label={section.label}
                                    icon={section.icon}
                                    collapsed={collapsed}
                                    onToggle={() => toggleSection(section.label)}
                                />
                                {!collapsed && (
                                    <SidebarGroupContent>
                                        <SidebarMenu>
                                            {section.items.map(item => renderNavItem(item))}
                                        </SidebarMenu>
                                    </SidebarGroupContent>
                                )}
                            </SidebarGroup>
                        );
                    })
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="View Site">
                            <a href="/" target="_blank" rel="noopener noreferrer">
                                <Globe />
                                <span>View Site</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

function FlashToast({ message, type }: { message: string; type: 'success' | 'error' }) {
    const [visible, setVisible] = useState(true);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const hide = setTimeout(() => {
            setExiting(true);
            setTimeout(() => setVisible(false), 300);
        }, 4000);
        return () => clearTimeout(hide);
    }, [message]);

    if (!visible) return null;

    const isSuccess = type === 'success';

    return (
        <div
            className={`fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex items-start gap-3 max-w-sm w-auto sm:w-full rounded-xl border shadow-lg px-4 py-3.5 transition-all duration-300 ${
                exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
            } ${
                isSuccess
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
            }`}
        >
            {isSuccess
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            }
            <p className="text-sm font-medium flex-1">{message}</p>
            <button
                onClick={() => { setExiting(true); setTimeout(() => setVisible(false), 300); }}
                className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth, flash, url } = usePage().props as unknown as SharedProps & { url: string };
    const currentPath = new URL(url, window.location.origin).pathname;

    const flashCounter = useRef(0);
    const lastSuccess = useRef<string | null>(null);
    const lastError = useRef<string | null>(null);

    if (flash?.success && flash.success !== lastSuccess.current) {
        lastSuccess.current = flash.success;
        flashCounter.current += 1;
    }
    const successKey = flashCounter.current;

    if (flash?.error && flash.error !== lastError.current) {
        lastError.current = flash.error;
        flashCounter.current += 1;
    }
    const errorKey = flashCounter.current;

    const initials = (auth.user?.name ?? 'U')
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <SidebarProvider>
            <AdminSidebar currentPath={currentPath} userRole={auth.user?.role} />

            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sticky top-0 z-40 min-w-0">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1" />

                    <div className="flex items-center gap-1">
                        <ModeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent transition-colors outline-none">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                        {initials}
                                    </div>
                                    <span className="hidden md:block text-foreground font-medium">{auth.user?.name}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5">
                                    <p className="text-sm font-medium">{auth.user?.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{auth.user?.role}</p>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/profile" className="cursor-pointer">
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => router.post('/logout')}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {flash?.success && <FlashToast key={`s-${successKey}`} message={flash.success} type="success" />}
                {flash?.error   && <FlashToast key={`e-${errorKey}`}   message={flash.error}   type="error" />}

                <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
