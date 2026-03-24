import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import offersRoute from '@/routes/offers';

type OfferItem = {
    id: number;
    description: string;
    quantity: number;
    unit: string | null;
    unit_price: number;
    interval: string | null;
};

type Offer = {
    id: number;
    number: string | null;
    status: string;
    version: number;
    currency: string;
    notes: string | null;
    items: OfferItem[];
    total: number;
    customer?: { id: number; name: string } | null;
    site?: { id: number; name: string } | null;
};

type Props = {
    offer: Offer | { data: Offer };
};

const breadcrumbs = (offer: Offer): BreadcrumbItem[] => [
    { title: 'Angebote', href: offersRoute.index().url },
        { title: offer.number ?? 'Angebot', href: offersRoute.show(offer.id).url },
];

export default function OfferShow({ offer }: Props) {
    const normalized = 'data' in offer ? offer.data : offer;
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const [sending, setSending] = useState(false);
    const confirmDelete = () => {
        if (!window.confirm('Angebot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(offersRoute.destroy(normalized.id).url, { replace: true });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs(normalized)}>
            <Head title="Angebot" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{normalized.number ?? 'Angebot'}</h1>
                        <p className="text-sm text-muted-foreground">
                            Version {normalized.version}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${statusClasses(normalized.status)}`}>
                                {formatStatus(normalized.status)}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kunde: {normalized.customer?.name ?? '—'}
                            {normalized.site?.name ? ` · Objekt: ${normalized.site.name}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={offersRoute.edit(normalized.id).url}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Bearbeiten
                        </Link>
                        <Link
                            href={`/offers/${normalized.id}/service-report`}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Leistungsverzeichnis
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.open(`/offers/${normalized.id}/service-report/pdf`, '_blank', 'noopener,noreferrer')}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            LV PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => window.open(offersRoute.pdf(normalized.id).url, '_blank', 'noopener,noreferrer')}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            PDF
                        </button>
                        <button
                            type="button"
                            disabled={sending}
                            onClick={() => {
                                setSending(true);
                                router.post(offersRoute.send(normalized.id).url, {
                                    preserveScroll: true,
                                    onFinish: () => setSending(false),
                                });
                            }}
                            className={`rounded-md px-3 py-2 text-sm font-semibold text-primary-foreground ${
                                sending ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary'
                            }`}
                        >
                            {sending ? 'Sende…' : 'Senden'}
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                            Löschen
                        </button>
                    </div>
                </div>

                {flash.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        {flash.error}
                    </div>
                )}

                <div className="rounded-xl border border-border/60 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Leistung</th>
                                <th className="px-4 py-3 text-left font-medium">Menge</th>
                                <th className="px-4 py-3 text-left font-medium">Preis</th>
                                <th className="px-4 py-3 text-left font-medium">Intervall</th>
                            </tr>
                        </thead>
                        <tbody>
                            {normalized.items.map((item) => (
                                <tr key={item.id} className="border-t border-border/60">
                                    <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                    <td className="px-4 py-3">
                                        {item.quantity} {item.unit ?? ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        {(item.unit_price * item.quantity).toFixed(2)} {normalized.currency}
                                    </td>
                                    <td className="px-4 py-3">{item.interval ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end text-lg font-semibold">
                    Gesamt: {normalized.total.toFixed(2)} {normalized.currency}
                </div>

                {normalized.notes && (
                    <div className="rounded-xl border border-border/60 bg-background p-4 text-sm text-muted-foreground">
                        {normalized.notes}
                    </div>
                )}
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
