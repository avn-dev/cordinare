import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import customersRoute from '@/routes/customers';
import sitesRoute from '@/routes/sites';
import offersRoute from '@/routes/offers';

type Customer = {
    id: number;
    name: string;
    status: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    created_at: string | null;
};

type Site = {
    id: number;
    name: string;
    status: string;
    address_line1: string | null;
    city: string | null;
    country: string | null;
};

type Offer = {
    id: number;
    number: string | null;
    status: string;
    created_at: string | null;
    site?: { id: number; name: string } | null;
};

type Props = {
    customer: Customer | { data: Customer };
    sites: { data: Site[] };
    offers: { data: Offer[] };
    stats: { sites: number; offers: number };
};

export default function CustomerShow({ customer, sites, offers, stats }: Props) {
    const normalized = 'data' in customer ? customer.data : customer;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kunden', href: customersRoute.index().url },
        { title: normalized.name, href: customersRoute.show(normalized.id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kunde ${normalized.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{normalized.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Status: {normalized.status} · Erstellt{' '}
                            {normalized.created_at ? new Date(normalized.created_at).toLocaleString('de-DE') : '—'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={customersRoute.edit(normalized.id).url}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Bearbeiten
                        </Link>
                        <Link
                            href={`${sitesRoute.create().url}?customer_id=${normalized.id}`}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Objekt anlegen
                        </Link>
                        <Link
                            href={`${offersRoute.create().url}?customer_id=${normalized.id}`}
                            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Angebot erstellen
                        </Link>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Objekte</p>
                        <p className="mt-2 text-2xl font-semibold">{stats.sites}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Angebote</p>
                        <p className="mt-2 text-2xl font-semibold">{stats.offers}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4 md:col-span-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Kontakt</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                            <div>{normalized.contact_name ?? '—'}</div>
                            <div>{normalized.email ?? '—'}</div>
                            <div>{normalized.phone ?? '—'}</div>
                        </div>
                    </div>
                </div>

                {normalized.notes && (
                    <div className="rounded-xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                        {normalized.notes}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-background">
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                            <h2 className="text-sm font-semibold">Objekte</h2>
                            <Link
                                href={`${sitesRoute.index().url}?customer_id=${normalized.id}`}
                                className="text-xs font-semibold text-emerald-600"
                            >
                                Alle anzeigen
                            </Link>
                        </div>
                        <div className="divide-y divide-border/60">
                            {sites.data.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-muted-foreground">Keine Objekte vorhanden.</div>
                            ) : (
                                sites.data.map((site) => (
                                    <div key={site.id} className="px-4 py-3">
                                        <Link
                                            href={sitesRoute.edit(site.id).url}
                                            className="text-sm font-semibold text-foreground"
                                        >
                                            {site.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            {site.address_line1 ?? '—'}, {site.city ?? '—'} {site.country ?? ''}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background">
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                            <h2 className="text-sm font-semibold">Letzte Angebote</h2>
                            <Link
                                href={offersRoute.index().url}
                                className="text-xs font-semibold text-emerald-600"
                            >
                                Alle anzeigen
                            </Link>
                        </div>
                        <div className="divide-y divide-border/60">
                            {offers.data.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-muted-foreground">Keine Angebote vorhanden.</div>
                            ) : (
                                offers.data.map((offer) => (
                                    <div key={offer.id} className="px-4 py-3">
                                        <Link
                                            href={offersRoute.show(offer.id).url}
                                            className="text-sm font-semibold text-foreground"
                                        >
                                            {offer.number ?? 'Angebot'}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            Status: {offer.status}
                                            {offer.site?.name ? ` · Objekt: ${offer.site.name}` : ''}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
