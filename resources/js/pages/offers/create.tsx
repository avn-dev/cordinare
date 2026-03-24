import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import offersRoute from '@/routes/offers';

type Customer = { id: number; name: string };
type Site = { id: number; name: string; customer_id: number };

type Props = {
    customers: { data: Customer[] };
    sites: { data: Site[] };
    number: string;
    defaults?: {
        customer_id?: number | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Angebote', href: offersRoute.index().url },
    { title: 'Neu', href: offersRoute.create().url },
];

export default function OfferCreate({ customers, sites, number, defaults }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: defaults?.customer_id ?? customers.data[0]?.id ?? '',
        site_id: '',
        number,
        currency: 'EUR',
        valid_until: '',
        notes: '',
        items: [
            { description: '', quantity: 1, unit: 'Std', unit_price: 0, interval: 'einmalig' },
        ],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(offersRoute.store().url);
    };

    const updateItem = (index: number, key: string, value: string | number) => {
        const next = [...data.items];
        // @ts-expect-error dynamic key update
        next[index][key] = value;
        setData('items', next);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { description: '', quantity: 1, unit: 'Std', unit_price: 0, interval: 'einmalig' },
        ]);
    };

    const removeItem = (index: number) => {
        if (data.items.length === 1) return;
        setData(
            'items',
            data.items.filter((_, idx) => idx !== index),
        );
    };

    const filteredSites = sites.data.filter((site) => site.customer_id === data.customer_id);

    useEffect(() => {
        if (data.site_id && !filteredSites.some((site) => site.id === data.site_id)) {
            setData('site_id', '');
        }
    }, [data.customer_id, filteredSites, data.site_id, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neues Angebot" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium">Kunde</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.customer_id}
                            onChange={(e) => setData('customer_id', Number(e.target.value))}
                        >
                            {customers.data.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name}
                                </option>
                            ))}
                        </select>
                        {errors.customer_id && <div className="mt-1 text-xs text-red-600">{errors.customer_id}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Objekt (optional)</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.site_id}
                            onChange={(e) => setData('site_id', e.target.value ? Number(e.target.value) : '')}
                        >
                            <option value="">—</option>
                            {filteredSites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </select>
                        {filteredSites.length === 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                                Für diesen Kunden sind noch keine Objekte hinterlegt.
                            </div>
                        )}
                        {errors.site_id && <div className="mt-1 text-xs text-red-600">{errors.site_id}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Nummer</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.number}
                            onChange={(e) => setData('number', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Gültig bis</label>
                        <input
                            type="date"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.valid_until}
                            onChange={(e) => setData('valid_until', e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 p-4">
                    <div className="text-sm font-semibold">Leistungsverzeichnis</div>
                    <div className="mt-4 grid gap-3">
                        {data.items.map((item, index) => (
                            <div key={index} className="grid gap-3 md:grid-cols-5">
                                <input
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2"
                                    placeholder="Beschreibung"
                                    value={item.description}
                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                />
                                <input
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    type="number"
                                    step="0.01"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                                />
                                <input
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    placeholder="Einheit"
                                    value={item.unit}
                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                />
                                <input
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    type="number"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                                >
                                    Entfernen
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="mt-4 w-fit rounded-md border border-border px-3 py-2 text-xs text-muted-foreground"
                    >
                        Position hinzufügen
                    </button>
                </div>

                <div>
                    <label className="text-sm font-medium">Notizen</label>
                    <textarea
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        rows={4}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                    Angebot speichern
                </button>
            </form>
        </AppLayout>
    );
}
