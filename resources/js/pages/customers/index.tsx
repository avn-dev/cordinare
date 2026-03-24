import { Head, Link, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import customersRoute from '@/routes/customers';

type Customer = {
    id: number;
    name: string;
    status: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
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
    customers: Paginated<Customer>;
    filters: {
        status: string;
        search: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kunden', href: customersRoute.index().url },
];

const statusOptions = [
    { value: '', label: 'Alle' },
    { value: 'active', label: 'Aktiv' },
    { value: 'inactive', label: 'Inaktiv' },
];

export default function CustomersIndex({ customers, filters }: Props) {
    const { data, setData, get } = useForm({
        status: filters.status ?? '',
        search: filters.search ?? '',
    });

    const confirmDelete = (customerId: number) => {
        if (!window.confirm('Kunde wirklich löschen? Zugehörige Objekte und Angebote bleiben bestehen.')) {
            return;
        }
        router.delete(customersRoute.destroy(customerId).url, { preserveScroll: true, replace: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(customersRoute.index().url, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kunden" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Kunden</h1>
                        <p className="text-sm text-muted-foreground">Alle aktiven Kunden im Überblick.</p>
                    </div>
                    <Link
                        href={customersRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neuer Kunde
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-3">
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
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Suche</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder="Name, Kontakt, Email"
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
                            href={customersRoute.index().url}
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
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Kontakt</th>
                                <th className="px-4 py-3 text-left font-medium">Erstellt</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                                        Keine Kunden vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                customers.data.map((customer) => (
                                    <tr key={customer.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <Link href={customersRoute.show(customer.id).url} className="hover:underline">
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(customer.status)}`}>
                                                {formatStatus(customer.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div>{customer.contact_name ?? '—'}</div>
                                            <div>{customer.email ?? '—'}</div>
                                            <div>{customer.phone ?? '—'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {customer.created_at ? new Date(customer.created_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={customersRoute.edit(customer.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(customer.id)}
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
                    {customers.meta.links.map((link) => (
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
