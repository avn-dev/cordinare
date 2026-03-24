import { Head, useForm, router } from '@inertiajs/react';
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
    notes: string | null;
};

type Props = {
    customer: Customer | { data: Customer };
};

export default function CustomerEdit({ customer }: Props) {
    const normalized = 'data' in customer ? customer.data : customer;

    const { data, setData, put, processing, errors } = useForm({
        name: normalized.name,
        status: normalized.status,
        contact_name: normalized.contact_name ?? '',
        email: normalized.email ?? '',
        phone: normalized.phone ?? '',
        notes: normalized.notes ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Kunden', href: customersRoute.index().url },
        { title: normalized.name, href: customersRoute.edit(normalized.id).url },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(customersRoute.update(normalized.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kunde ${normalized.name}`} />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{normalized.name}</h1>
                        <p className="text-sm text-muted-foreground">Kundenstammdaten bearbeiten.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.delete(customersRoute.destroy(normalized.id).url)}
                        className="rounded-md border border-border px-4 py-2 text-sm text-rose-600"
                    >
                        Löschen
                    </button>
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
                        <label className="text-sm font-medium">Kontakt</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.contact_name}
                            onChange={(e) => setData('contact_name', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Telefon</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Notizen</label>
                        <textarea
                            className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>
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
