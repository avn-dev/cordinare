import { Link, usePage } from '@inertiajs/react';
import { Clock, FileText, Inbox, LayoutGrid, MapPin, Timer, Users, CalendarX2, ShieldCheck, UserRound, Boxes, AlertTriangle, CalendarCheck2 } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';
import employeeRoute from '@/routes/employee';
import customersRoute from '@/routes/customers';
import offersRoute from '@/routes/offers';
import leads from '@/routes/leads';
import sitesRoute from '@/routes/sites';
import shiftsRoute from '@/routes/shifts';
import shiftTemplatesRoute from '@/routes/shift-templates';
import timeEntriesRoute from '@/routes/time-entries';
import absencesRoute from '@/routes/absences';
import auditLogsRoute from '@/routes/audit-logs';
import usersRoute from '@/routes/users';
import inventoryRoute from '@/routes/inventory';

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'QM',
        href: '/qm/issues',
        icon: AlertTriangle,
    },
    {
        title: 'Besichtigungen',
        href: '/inspections',
        icon: CalendarCheck2,
    },
    {
        title: 'Mein Bereich',
        href: employeeRoute.portal(),
        icon: UserRound,
    },
    {
        title: 'Leads',
        href: leads.index(),
        icon: Inbox,
    },
    {
        title: 'Kunden',
        href: customersRoute.index(),
        icon: Users,
    },
    {
        title: 'Mitarbeiter',
        href: usersRoute.index(),
        icon: UserRound,
    },
    {
        title: 'Objekte',
        href: sitesRoute.index(),
        icon: MapPin,
    },
    {
        title: 'Inventar',
        href: inventoryRoute.index(),
        icon: Boxes,
    },
    {
        title: 'Angebote',
        href: offersRoute.index(),
        icon: FileText,
    },
    {
        title: 'Schichten',
        href: shiftsRoute.index(),
        icon: Clock,
    },
    {
        title: 'Regelmäßige Schichten',
        href: shiftTemplatesRoute.index(),
        icon: Clock,
    },
    {
        title: 'Zeiterfassung',
        href: timeEntriesRoute.index(),
        icon: Timer,
    },
    {
        title: 'Abwesenheiten',
        href: absencesRoute.index(),
        icon: CalendarX2,
    },
    {
        title: 'Audit Logs',
        href: auditLogsRoute.index(),
        icon: ShieldCheck,
    },
];

export function AppSidebar() {
    const page = usePage();
    const role = (page.props as { auth?: { user?: { role?: string } } })?.auth?.user?.role ?? 'employee';
    const employeeNavItems = adminNavItems.filter((item) => item.title === 'Mein Bereich');
    const navItems = role === 'employee' ? employeeNavItems : adminNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
