import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import inventoryRoute from '@/routes/inventory';

type Movement = {
    id: number;
    from_site: string | null;
    to_site: string | null;
    moved_by: string | null;
    moved_at: string | null;
    notes: string | null;
};

type Props = {
    item: {
        id: number;
        name: string;
        category: string | null;
        serial_number: string | null;
        status: string;
        condition: string;
        quantity: number;
        unit: string;
        last_seen_at: string | null;
        notes: string | null;
        site_id: number | null;
    };
    sites: { id: number; name: string }[];
    movements: Movement[];
};

const breadcrumbs = (item: Props['item']): BreadcrumbItem[] => [
    { title: 'Inventar', href: inventoryRoute.index().url },
    { title: item.name, href: inventoryRoute.edit(item.id).url },
];

export default function InventoryEdit({ item, sites, movements }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: item.name ?? '',
        category: item.category ?? '',
        serial_number: item.serial_number ?? '',
        status: item.status ?? 'active',
        condition: item.condition ?? 'good',
        quantity: Number(item.quantity ?? 1),
        unit: item.unit ?? 'Stk',
        site_id: item.site_id ?? null,
        last_seen_at: item.last_seen_at ? item.last_seen_at.slice(0, 16) : '',
        notes: item.notes ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(inventoryRoute.update(item.id).url);
    };

    const confirmDelete = () => {
        if (!window.confirm('Inventar-Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(inventoryRoute.destroy(item.id).url, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(item)}>
            <Head title="Inventar bearbeiten" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-semibold">{item.name}</h1>
                            <p className="text-sm text-muted-foreground">Inventar bearbeiten</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                            >
                                Löschen
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                            >
                                Speichern
                            </button>
                        </div>
                    </div>

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
                </form>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Standorthistorie</h2>
                    <div className="mt-4 space-y-2">
                        {movements.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Bewegungen erfasst.</div>
                        ) : (
                            movements.map((movement) => (
                                <div
                                    key={movement.id}
                                    className="rounded-md border border-border/60 px-3 py-2 text-sm"
                                >
                                    <div className="font-medium text-foreground">
                                        {movement.from_site ?? 'Unbekannt'} → {movement.to_site ?? 'Unbekannt'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {movement.moved_at ? new Date(movement.moved_at).toLocaleString('de-DE') : '—'}
                                        {movement.moved_by ? ` · ${movement.moved_by}` : ''}
                                    </div>
                                    {movement.notes && (
                                        <div className="mt-2 text-xs text-muted-foreground">{movement.notes}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
