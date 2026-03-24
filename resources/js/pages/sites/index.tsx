import { Head, Link, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import sitesRoute from '@/routes/sites';

type Site = {
    id: number;
    customer?: { id: number; name: string } | null;
    name: string;
    status: string;
    city: string | null;
    country: string | null;
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
    sites: Paginated<Site>;
    filters: {
        customer_id: number | null;
        status: string;
        search: string;
        sort: string;
    };
    customers: { id: number; name: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Objekte', href: sitesRoute.index().url },
];

const statusOptions = [
    { value: '', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'inactive', label: 'Inaktiv' },
];

const sortOptions = [
    { value: '', label: 'Neueste' },
    { value: 'name', label: 'Name' },
    { value: 'customer', label: 'Kunde' },
    { value: 'created_at', label: 'Erstellt' },
];

export default function SitesIndex({ sites, filters, customers }: Props) {
    const { data, setData, get } = useForm({
        customer_id: filters.customer_id ?? '',
        status: filters.status ?? '',
        search: filters.search ?? '',
        sort: filters.sort ?? '',
    });

    const confirmDelete = (siteId: number) => {
        if (!window.confirm('Objekt wirklich löschen? Zugehörige Schichten bleiben bestehen.')) {
            return;
        }
        router.delete(sitesRoute.destroy(siteId).url, { preserveScroll: true, replace: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(sitesRoute.index().url, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Objekte" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Objekte</h1>
                        <p className="text-sm text-muted-foreground">Standorte und Einsatzorte im Überblick.</p>
                    </div>
                    <Link
                        href={sitesRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neues Objekt
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Kunde</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Status</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Suche</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder="Name, Stadt, Adresse"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Sortierung</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.sort}
                                onChange={(e) => setData('sort', e.target.value)}
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Filtern
                        </button>
                        <Link
                            href={sitesRoute.index().url}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            Zurücksetzen
                        </Link>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Kunde</th>
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Ort</th>
                                <th className="px-4 py-3 text-left font-medium">Erstellt</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sites.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                        Keine Objekte vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                sites.data.map((site) => (
                                    <tr key={site.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 text-muted-foreground">{site.customer?.name ?? '—'}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{site.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(site.status)}`}>
                                                {formatStatus(site.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {site.city ?? '—'} {site.country ? `(${site.country})` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {site.created_at ? new Date(site.created_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={sitesRoute.edit(site.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(site.id)}
                                                    className="text-sm font-semibold text-rose-600"
                                                >
                                                    Löschen
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {sites.meta.links.map((link) => (
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
        case 'inactive':
            return 'Inaktiv';
        default:
            return 'Aktiv';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'inactive':
            return 'bg-slate-500/15 text-slate-600';
        default:
            return 'bg-emerald-500/15 text-emerald-600';
    }
}
