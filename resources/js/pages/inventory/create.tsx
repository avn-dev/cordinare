import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import inventoryRoute from '@/routes/inventory';

type Props = {
    sites: { id: number; name: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventar', href: inventoryRoute.index().url },
    { title: 'Neu', href: inventoryRoute.create().url },
];

export default function InventoryCreate({ sites }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category: '',
        serial_number: '',
        status: 'active',
        condition: 'good',
        quantity: 1,
        unit: 'Stk',
        site_id: null as number | null,
        last_seen_at: '',
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(inventoryRoute.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventar anlegen" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                        <label className="text-sm font-medium">Kategorie</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            placeholder="z.B. Maschinen, Reinigung"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Seriennummer</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.serial_number}
                            onChange={(e) => setData('serial_number', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Objekt</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.site_id}
                            onChange={(e) => setData('site_id', e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">—</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                    {site.name}
                                </option>
                            ))}
                        </select>
                        {errors.site_id && <div className="mt-1 text-xs text-red-600">{errors.site_id}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="active">Aktiv</option>
                            <option value="maintenance">Wartung</option>
                            <option value="lost">Verloren</option>
                            <option value="inactive">Inaktiv</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Zustand</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.condition}
                            onChange={(e) => setData('condition', e.target.value)}
                        >
                            <option value="good">Gut</option>
                            <option value="needs_service">Service</option>
                            <option value="damaged">Defekt</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Menge</label>
                        <input
                            type="number"
                            step="0.01"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', Number(e.target.value))}
                        />
                        {errors.quantity && <div className="mt-1 text-xs text-red-600">{errors.quantity}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Einheit</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.unit}
                            onChange={(e) => setData('unit', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Zuletzt gesehen</label>
                        <input
                            type="datetime-local"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.last_seen_at}
                            onChange={(e) => setData('last_seen_at', e.target.value)}
                        />
                    </div>
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
                    Speichern
                </button>
            </form>
        </AppLayout>
    );
}
