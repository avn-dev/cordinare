import { Head, Link, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import inventoryRoute from '@/routes/inventory';

type InventoryItem = {
    id: number;
    name: string;
    category: string | null;
    serial_number: string | null;
    status: string;
    condition: string;
    quantity: number;
    unit: string;
    last_seen_at: string | null;
    site?: { id: number; name: string } | null;
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
    items: Paginated<InventoryItem>;
    filters: {
        site_id: number | null;
        status: string;
        category: string;
        search: string;
    };
    sites: { id: number; name: string }[];
    categories: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventar', href: inventoryRoute.index().url },
];

const statusOptions = [
    { value: '', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'maintenance', label: 'Wartung' },
    { value: 'lost', label: 'Verloren' },
    { value: 'inactive', label: 'Inaktiv' },
];

const conditionOptions = [
    { value: '', label: 'Alle' },
    { value: 'good', label: 'Gut' },
    { value: 'needs_service', label: 'Service' },
    { value: 'damaged', label: 'Defekt' },
];

export default function InventoryIndex({ items, filters, sites, categories }: Props) {
    const { data, setData, get } = useForm({
        site_id: filters.site_id ?? '',
        status: filters.status ?? '',
        category: filters.category ?? '',
        search: filters.search ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(inventoryRoute.index().url, { preserveState: true, replace: true });
    };

    const confirmDelete = (itemId: number) => {
        if (!window.confirm('Inventar-Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(inventoryRoute.destroy(itemId).url, { preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventar" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Inventar</h1>
                        <p className="text-sm text-muted-foreground">Geräte & Material pro Objekt im Blick.</p>
                    </div>
                    <Link
                        href={inventoryRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neuer Eintrag
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Objekt</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.site_id}
                                onChange={(e) => setData('site_id', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
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
                            <label className="text-xs font-semibold text-muted-foreground">Kategorie</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
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
                                placeholder="Name oder Seriennummer"
                            />
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
                            href={inventoryRoute.index().url}
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
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Kategorie</th>
                                <th className="px-4 py-3 text-left font-medium">Seriennr.</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Zustand</th>
                                <th className="px-4 py-3 text-left font-medium">Menge</th>
                                <th className="px-4 py-3 text-left font-medium">Objekt</th>
                                <th className="px-4 py-3 text-left font-medium">Zuletzt gesehen</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                                        Keine Inventar-Einträge vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                items.data.map((item) => (
                                    <tr key={item.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <Link href={inventoryRoute.edit(item.id).url} className="hover:underline">
                                                {item.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.category ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.serial_number ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(item.status)}`}>
                                                {formatStatus(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${conditionClasses(item.condition)}`}>
                                                {formatCondition(item.condition)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {Number(item.quantity).toFixed(2)} {item.unit}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.site?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.last_seen_at ? new Date(item.last_seen_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={inventoryRoute.edit(item.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(item.id)}
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
                    {items.meta.links.map((link) => (
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
        case 'maintenance':
            return 'Wartung';
        case 'lost':
            return 'Verloren';
        case 'inactive':
            return 'Inaktiv';
        default:
            return 'Aktiv';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'maintenance':
            return 'bg-amber-500/15 text-amber-600';
        case 'lost':
            return 'bg-rose-500/15 text-rose-600';
        case 'inactive':
            return 'bg-slate-500/15 text-slate-600';
        default:
            return 'bg-emerald-500/15 text-emerald-600';
    }
}

function formatCondition(condition: string) {
    switch (condition) {
        case 'needs_service':
            return 'Service';
        case 'damaged':
            return 'Defekt';
        default:
            return 'Gut';
    }
}

function conditionClasses(condition: string) {
    switch (condition) {
        case 'needs_service':
            return 'bg-amber-500/15 text-amber-600';
        case 'damaged':
            return 'bg-rose-500/15 text-rose-600';
        default:
            return 'bg-emerald-500/15 text-emerald-600';
    }
}
