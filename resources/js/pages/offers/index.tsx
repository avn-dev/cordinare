import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import offersRoute from '@/routes/offers';

type Offer = {
    id: number;
    number: string | null;
    status: string;
    version: number;
    currency: string;
    total: number;
    customer?: { id: number; name: string } | null;
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
    offers: Paginated<Offer>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Angebote', href: offersRoute.index().url },
];

export default function OffersIndex({ offers }: Props) {
    const confirmDelete = (offerId: number) => {
        if (!window.confirm('Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(offersRoute.destroy(offerId).url, { preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Angebote" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-semibold">Angebote</h1>
                        <p className="text-sm text-muted-foreground">Alle Angebote und Versionen.</p>
                    </div>
                    <Link
                        href={offersRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neues Angebot
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Nummer</th>
                                <th className="px-4 py-3 text-left font-medium">Kunde</th>
                                <th className="px-4 py-3 text-left font-medium">Objekt</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Version</th>
                                <th className="px-4 py-3 text-left font-medium">Summe</th>
                                <th className="px-4 py-3 text-left font-medium">Erstellt</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
                                        Keine Angebote vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                offers.data.map((offer) => (
                                    <tr key={offer.id} className="border-t border-border/60">
                                        <td className="px-4 py-3">
                                            <Link className="font-medium text-foreground" href={offersRoute.show(offer.id).url}>
                                                {offer.number ?? 'Angebot'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">{offer.customer?.name ?? '—'}</td>
                                        <td className="px-4 py-3">{offer.site?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(offer.status)}`}>
                                                {formatStatus(offer.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">v{offer.version}</td>
                                        <td className="px-4 py-3">
                                            {offer.total.toFixed(2)} {offer.currency}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {offer.created_at ? new Date(offer.created_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={offersRoute.edit(offer.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(offer.id)}
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
                    {offers.meta.links.map((link) => (
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
        case 'sent':
            return 'Gesendet';
        case 'accepted':
            return 'Angenommen';
        case 'rejected':
            return 'Abgelehnt';
        default:
            return 'Entwurf';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'sent':
            return 'bg-sky-500/15 text-sky-600';
        case 'accepted':
            return 'bg-emerald-500/15 text-emerald-600';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-600';
        default:
            return 'bg-slate-500/15 text-slate-600';
    }
}
