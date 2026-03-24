import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import leadsRoute from '@/routes/leads';
import customersRoute from '@/routes/customers';

type Lead = {
    id: number;
    status: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string | null;
    source: string | null;
    tags: string[] | null;
    follow_up_at: string | null;
    converted_customer_id: string | null;
    created_at: string | null;
};

type Props = {
    lead: Lead | { data: Lead };
};

export default function LeadShow({ lead }: Props) {
    const normalized = 'data' in lead ? lead.data : lead;

    const { data, setData, post, processing, errors } = useForm({
        customer_name: normalized.name,
        customer_status: 'active',
        contact_name: normalized.name,
        email: normalized.email ?? '',
        phone: normalized.phone ?? '',
        notes: normalized.message ?? '',
        site_name: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        city: '',
        country: 'DE',
        access_notes: '',
        special_instructions: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: leadsRoute.index().url },
        { title: normalized.name, href: leadsRoute.show(normalized.id).url },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(leadsRoute.convert(normalized.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Lead ${normalized.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{normalized.name}</h1>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${statusClasses(normalized.status)}`}>
                                {formatStatus(normalized.status)}
                            </span>
                        </div>
                    </div>
                    {normalized.converted_customer_id && (
                        <Link
                            href={customersRoute.show(normalized.converted_customer_id).url}
                            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-emerald-600"
                        >
                            Kunde öffnen
                        </Link>
                    )}
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Kontakt</h2>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <div>Email: {normalized.email ?? '—'}</div>
                        <div>Telefon: {normalized.phone ?? '—'}</div>
                        <div>Quelle: {normalized.source ?? '—'}</div>
                        <div>Eingang: {normalized.created_at ? new Date(normalized.created_at).toLocaleString('de-DE') : '—'}</div>
                        <div>Follow-up: {normalized.follow_up_at ? new Date(normalized.follow_up_at).toLocaleString('de-DE') : '—'}</div>
                        <div>Nachricht: {normalized.message ?? '—'}</div>
                        <div>Tags: {normalized.tags && normalized.tags.length > 0 ? normalized.tags.join(', ') : '—'}</div>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Lead konvertieren</h2>
                    {normalized.converted_customer_id ? (
                        <div className="mt-3 text-sm text-muted-foreground">
                            Dieser Lead wurde bereits konvertiert.
                        </div>
                    ) : (
                        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Kundenname</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                />
                                {errors.customer_name && (
                                    <div className="mt-1 text-xs text-red-600">{errors.customer_name}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Kontakt</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.contact_name}
                                    onChange={(e) => setData('contact_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                                <input
                                    type="email"
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Telefon</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground">Notiz</label>
                                <textarea
                                    className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <h3 className="text-sm font-semibold">Optionales Objekt</h3>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Objektname</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.site_name}
                                    onChange={(e) => setData('site_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Adresse</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.address_line1}
                                    onChange={(e) => setData('address_line1', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Adresszusatz</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.address_line2}
                                    onChange={(e) => setData('address_line2', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">PLZ</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.postal_code}
                                    onChange={(e) => setData('postal_code', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Stadt</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Land</label>
                                <input
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground">Zutrittsinfo</label>
                                <textarea
                                    className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.access_notes}
                                    onChange={(e) => setData('access_notes', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground">Besonderheiten</label>
                                <textarea
                                    className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.special_instructions}
                                    onChange={(e) => setData('special_instructions', e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button
                                    type="submit"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                                    disabled={processing}
                                >
                                    In Kunde umwandeln
                                </button>
                            </div>
                        </form>
                    )}
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
