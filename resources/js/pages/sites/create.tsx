import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import sitesRoute from '@/routes/sites';

type Customer = { id: number; name: string };

type Props = {
    customers: Customer[];
    defaults?: {
        customer_id?: number | null;
    };
};

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Objekte', href: sitesRoute.index().url },
    { title: 'Neu', href: sitesRoute.create().url },
];

export default function SiteCreate({ customers, defaults }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: defaults?.customer_id ?? customers[0]?.id ?? '',
        name: '',
        status: 'active',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        city: '',
        country: 'DE',
        latitude: '',
        longitude: '',
        access_notes: '',
        special_instructions: '',
        closures: [] as { day_of_week: number; starts_at: string; ends_at: string; label?: string }[],
    });

    const addClosure = () => {
        setData('closures', [
            ...data.closures,
            { day_of_week: 0, starts_at: '00:00', ends_at: '00:00', label: '' },
        ]);
    };

    const updateClosure = (index: number, key: 'day_of_week' | 'starts_at' | 'ends_at' | 'label', value: string | number) => {
        const next = [...data.closures];
        next[index] = { ...next[index], [key]: value };
        setData('closures', next);
    };

    const removeClosure = (index: number) => {
        setData(
            'closures',
            data.closures.filter((_, idx) => idx !== index),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(sitesRoute.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neues Objekt" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Neues Objekt</h1>
                    <p className="text-sm text-muted-foreground">Objekt für einen Kunden anlegen.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium">Kunde</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.customer_id}
                            onChange={(e) => setData('customer_id', Number(e.target.value))}
                        >
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <div className="mt-1 text-xs text-red-600">{errors.customer_id}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="active">Aktiv</option>
                            <option value="inactive">Inaktiv</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Adresse</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.address_line1}
                            onChange={(e) => setData('address_line1', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Adresszusatz</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.address_line2}
                            onChange={(e) => setData('address_line2', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">PLZ</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.postal_code}
                            onChange={(e) => setData('postal_code', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Stadt</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Land</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.country}
                            onChange={(e) => setData('country', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Latitude</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.latitude}
                            onChange={(e) => setData('latitude', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Longitude</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.longitude}
                            onChange={(e) => setData('longitude', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Zutrittsinfo</label>
                        <textarea
                            className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.access_notes}
                            onChange={(e) => setData('access_notes', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Besonderheiten</label>
                        <textarea
                            className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.special_instructions}
                            onChange={(e) => setData('special_instructions', e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">Schließzeiten</h2>
                            <p className="text-xs text-muted-foreground">In diesen Zeitfenstern dürfen keine Schichten liegen.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addClosure}
                            className="text-xs font-semibold text-emerald-600"
                        >
                            + Schließzeit
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                        {data.closures.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Schließzeiten hinterlegt.</div>
                        ) : (
                            data.closures.map((closure, index) => (
                                <div key={`${closure.day_of_week}-${index}`} className="grid gap-2 md:grid-cols-5">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Tag</label>
                                        <select
                                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                            value={closure.day_of_week}
                                            onChange={(e) => updateClosure(index, 'day_of_week', Number(e.target.value))}
                                        >
                                            {dayLabels.map((label, idx) => (
                                                <option key={label} value={idx}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Von</label>
                                        <input
                                            type="time"
                                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                            value={closure.starts_at}
                                            onChange={(e) => updateClosure(index, 'starts_at', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground">Bis</label>
                                        <input
                                            type="time"
                                            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                            value={closure.ends_at}
                                            onChange={(e) => updateClosure(index, 'ends_at', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-semibold text-muted-foreground">Label</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                                value={closure.label ?? ''}
                                                onChange={(e) => updateClosure(index, 'label', e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeClosure(index)}
                                                className="mt-1 rounded-md border border-border px-3 py-2 text-xs text-rose-600"
                                            >
                                                Entfernen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {errors.closures && <div className="mt-2 text-xs text-red-600">{errors.closures}</div>}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        disabled={processing}
                    >
                        Speichern
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
