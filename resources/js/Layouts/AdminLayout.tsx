import { Link, usePage, router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useState } from 'react';
import {
    LayoutDashboard,
    CalendarDays,
    FileText,
    PenSquare,
    Image,
    ImageIcon,
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
    Settings,
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

const NAV_FULL = [
    { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/events',   label: 'Events',    icon: CalendarDays },
    { href: '/admin/orders',   label: 'Orders',    icon: ShoppingCart },
    { href: '/admin/users',    label: 'Users',     icon: Users },
    { href: '/admin/pages',    label: 'Pages',     icon: FileText },
    { href: '/admin/posts',    label: 'Posts',     icon: PenSquare },
    { href: '/admin/media',    label: 'Media',     icon: Image },
    { href: '/admin/banners',  label: 'Banners',   icon: ImageIcon },
    { href: '/admin/menus',    label: 'Menus',     icon: Menu },
    { href: '/admin/settings', label: 'Settings',  icon: Settings },
];

const NAV_CHECKIN_STAFF = [
    { href: '/admin/events',   label: 'Events',    icon: CalendarDays },
];

const EVENTS_SUB = [
    { href: '/admin/registrations', label: 'All Registrations', icon: ClipboardList },
    { href: '/admin/tickets',       label: 'All Tickets',       icon: Ticket },
    { href: '/admin/products',      label: 'All Products',      icon: ShoppingBag },
];

/**
 * Extract the event slug from the current path when viewing event sub-pages.
 * e.g. /admin/events/leadership-summit-2026/edit → leadership-summit-2026
 */
function getEventSlugFromPath(path: string): string | null {
    const match = path.match(/^\/admin\/events\/([^/]+)\/(edit|tickets|products|registrations|zones|check-in)/);
    return match ? match[1] : null;
}

function AdminSidebar({ currentPath, userRole }: { currentPath: string; userRole?: string }) {
    const isCheckinStaff = userRole === 'checkin_staff';
    const NAV = isCheckinStaff ? NAV_CHECKIN_STAFF : NAV_FULL;
    const isEventsSection =
        currentPath.startsWith('/admin/events') ||
        currentPath.startsWith('/admin/registrations') ||
        currentPath.startsWith('/admin/tickets') ||
        currentPath.startsWith('/admin/products');

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={isCheckinStaff ? '/admin/events' : '/admin'}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <LayoutDashboard className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold text-sidebar-foreground">Takaful</span>
                                    <span className="text-xs text-sidebar-foreground/60">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase tracking-wider text-[10px]">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV.map(item => {
                                const active =
                                    currentPath === item.href ||
                                    (item.href !== '/admin' && currentPath.startsWith(item.href));
                                const Icon = item.icon;

                                // Events with sub-items for global views (not for checkin_staff)
                                if (item.href === '/admin/events') {
                                    if (isCheckinStaff) {
                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isEventsSection}
                                                    tooltip={item.label}
                                                >
                                                    <Link href={item.href}>
                                                        <Icon />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    }

                                    return (
                                        <Collapsible
                                            key="events"
                                            asChild
                                            defaultOpen={isEventsSection}
                                            className="group/collapsible"
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        tooltip={item.label}
                                                        isActive={isEventsSection}
                                                    >
                                                        <Icon />
                                                        <span>{item.label}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        <SidebarMenuSubItem>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={currentPath === '/admin/events' || currentPath.startsWith('/admin/events/')}
                                                            >
                                                                <Link href="/admin/events">
                                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                                    <span>All Events</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                        {EVENTS_SUB.map(sub => (
                                                            <SidebarMenuSubItem key={sub.href}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={currentPath.startsWith(sub.href)}
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
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href}>
                                                <Icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="View Site">
                            <Link href="/">
                                <Globe />
                                <span>View Site</span>
                            </Link>
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
            className={`fixed top-4 right-4 z-[9999] flex items-start gap-3 max-w-sm w-full rounded-xl border shadow-lg px-4 py-3.5 transition-all duration-300 ${
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
    const { auth, flash } = usePage().props as unknown as SharedProps;
    const currentPath = window.location.pathname;

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
                {/* Top bar */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sticky top-0 z-40">
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

                {/* Flash toasts */}
                {flash?.success && <FlashToast key={flash.success} message={flash.success} type="success" />}
                {flash?.error   && <FlashToast key={flash.error}   message={flash.error}   type="error" />}

                {/* Page content */}
                <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

