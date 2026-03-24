import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import leads from '@/routes/leads';
import customersRoute from '@/routes/customers';

type Lead = {
    id: number;
    status: string;
    name: string;
    email: string | null;
    phone: string | null;
    source: string | null;
    converted_customer_id?: string | null;
    created_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
};

type Props = {
    leads: Paginated<Lead>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: leads.index().url },
];

export default function LeadsIndex({ leads: leadPagination }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Inbox</h1>
                        <p className="text-sm text-muted-foreground">Neue Kontaktanfragen und Leads.</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Kontakt</th>
                                <th className="px-4 py-3 text-left font-medium">Quelle</th>
                                <th className="px-4 py-3 text-left font-medium">Eingang</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leadPagination.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                        Keine Leads vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                leadPagination.data.map((lead) => (
                                    <tr key={lead.id} className="border-t border-border/60">
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(lead.status)}`}>
                                                {formatStatus(lead.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">{lead.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div>{lead.email ?? '—'}</div>
                                            <div>{lead.phone ?? '—'}</div>
                                        </td>
                                        <td className="px-4 py-3">{lead.source ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {lead.created_at ? new Date(lead.created_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {lead.converted_customer_id ? (
                                                <Link
                                                    href={customersRoute.show(lead.converted_customer_id).url}
                                                    className="text-xs font-semibold text-emerald-600"
                                                >
                                                    Kunde öffnen
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={leads.show(lead.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Öffnen
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {leadPagination.meta.links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.url ?? '#'}
                            className={`rounded-md border px-3 py-1 text-sm ${
                                link.active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground'
                            } ${link.url ? 'hover:border-primary/60' : 'pointer-events-none opacity-50'}`}
                            preserveScroll
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

function formatStatus(status: string) {
    switch (status) {
        case 'converted':
            return 'Konvertiert';
        case 'contacted':
            return 'Kontaktiert';
        case 'archived':
            return 'Archiviert';
        default:
            return 'Neu';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'converted':
            return 'bg-emerald-500/15 text-emerald-600';
        case 'contacted':
            return 'bg-sky-500/15 text-sky-600';
        case 'archived':
            return 'bg-slate-500/15 text-slate-600';
        default:
            return 'bg-amber-500/15 text-amber-600';
    }
}
