import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Besichtigungen', href: '/inspections' },
];

type Option = { id: number; name: string };

type Appointment = {
    id: number;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    sent_at: string | null;
    notes: string | null;
    site?: { id: number; name: string } | null;
    customer?: { id: number; name: string; email?: string | null } | null;
    assigned_user?: { id: number; name: string } | null;
};

type Props = {
    appointments: {
        data: Appointment[];
    };
    sites: { id: number; name: string; customer_id: number }[];
    customers: { id: number; name: string; email?: string | null }[];
    users: Option[];
    current_user_id: number | null;
};

const statusLabels: Record<string, string> = {
    planned: 'Geplant',
    confirmed: 'Bestätigt',
    cancelled: 'Abgesagt',
};

const statusTone = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'bg-emerald-100 text-emerald-700';
        case 'cancelled':
            return 'bg-rose-100 text-rose-700';
        default:
            return 'bg-amber-100 text-amber-700';
    }
};

export default function InspectionsIndex({ appointments, sites, customers, users, current_user_id }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const [sendingId, setSendingId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        customer_id: customers[0]?.id ?? '',
        site_id: sites[0]?.id ?? '',
        assigned_user_id: current_user_id ?? users[0]?.id ?? '',
        starts_at: '',
        ends_at: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inspections', {
            onSuccess: () => reset('starts_at', 'ends_at', 'notes'),
        });
    };

    const resend = (id: number) => {
        setSendingId(id);
        router.post(`/inspections/${id}/resend`, {}, { preserveScroll: true, onFinish: () => setSendingId(null) });
    };

    const updateStatus = (id: number, status: string) => {
        router.patch(`/inspections/${id}`, { status }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Besichtigungen" />
            <div className="flex flex-col gap-6 rounded-xl p-4">
                {(flash.success || flash.error) && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            flash.success
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                    >
                        {flash.success ?? flash.error}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Besichtigungen</h1>
                        <p className="text-sm text-muted-foreground">Terminbestätigungen an Auftraggeber senden.</p>
                    </div>
                    <Link href="/inspections/calendar" className="rounded-md border border-border px-3 py-2 text-sm">
                        Mein Kalender
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Neuer Besichtigungstermin</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                            {errors.customer_id && <div className="mt-1 text-xs text-rose-600">{errors.customer_id}</div>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Objekt</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.site_id}
                                onChange={(e) => setData('site_id', Number(e.target.value))}
                            >
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                            {errors.site_id && <div className="mt-1 text-xs text-rose-600">{errors.site_id}</div>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Zuständig</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.assigned_user_id}
                                onChange={(e) => setData('assigned_user_id', Number(e.target.value))}
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Start</label>
                            <input
                                type="datetime-local"
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                            />
                            {errors.starts_at && <div className="mt-1 text-xs text-rose-600">{errors.starts_at}</div>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Ende</label>
                            <input
                                type="datetime-local"
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)}
                            />
                            {errors.ends_at && <div className="mt-1 text-xs text-rose-600">{errors.ends_at}</div>}
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
                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                                processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                        >
                            {processing ? 'Speichere…' : 'Termin anlegen'}
                        </button>
                    </div>
                </form>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Termine</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Objekt</th>
                                    <th className="px-3 py-2 text-left font-medium">Kunde</th>
                                    <th className="px-3 py-2 text-left font-medium">Start</th>
                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                    <th className="px-3 py-2 text-left font-medium">Versand</th>
                                    <th className="px-3 py-2 text-left font-medium">Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-3 py-4 text-center text-sm text-muted-foreground">
                                            Keine Termine vorhanden.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map((appointment) => (
                                        <tr key={appointment.id} className="border-t border-border/60">
                                            <td className="px-3 py-2">{appointment.site?.name ?? '—'}</td>
                                            <td className="px-3 py-2">{appointment.customer?.name ?? '—'}</td>
                                            <td className="px-3 py-2">
                                                {appointment.starts_at
                                                    ? new Date(appointment.starts_at).toLocaleString('de-DE')
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(appointment.status)}`}>
                                                    {statusLabels[appointment.status] ?? appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {appointment.sent_at
                                                    ? new Date(appointment.sent_at).toLocaleString('de-DE')
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select
                                                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                                                        value={appointment.status}
                                                        onChange={(e) => updateStatus(appointment.id, e.target.value)}
                                                    >
                                                        <option value="planned">Geplant</option>
                                                        <option value="confirmed">Bestätigt</option>
                                                        <option value="cancelled">Abgesagt</option>
                                                    </select>
                                                    <Link
                                                        href={`/inspections/${appointment.id}/compose`}
                                                        className="text-xs font-semibold text-slate-600"
                                                    >
                                                        E-Mail bearbeiten
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        disabled={sendingId === appointment.id}
                                                        onClick={() => resend(appointment.id)}
                                                        className="text-xs font-semibold text-emerald-600"
                                                    >
                                                        {sendingId === appointment.id ? 'Sende…' : 'Bestätigung senden'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
