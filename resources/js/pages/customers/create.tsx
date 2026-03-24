import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import customersRoute from '@/routes/customers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Kunden', href: customersRoute.index().url },
    { title: 'Neu', href: customersRoute.create().url },
];

export default function CustomerCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        status: 'active',
        contact_name: '',
        email: '',
        phone: '',
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(customersRoute.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neuer Kunde" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Neuer Kunde</h1>
                    <p className="text-sm text-muted-foreground">Kundenstammdaten anlegen.</p>
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
