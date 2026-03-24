import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import shiftsRoute from '@/routes/shifts';

type SiteOption = { id: number; name: string };
type UserOption = { id: number; name: string; email: string; role: string | null };

type AssignmentRef = { user_id: number };

type Shift = {
    id: number;
    site_id: number;
    title: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    assignments?: { data: AssignmentRef[] } | AssignmentRef[];
};

type Props = {
    shift: Shift | { data: Shift };
    sites: SiteOption[];
    users: UserOption[];
};

const statusOptions = [
    { value: 'scheduled', label: 'Geplant' },
    { value: 'completed', label: 'Abgeschlossen' },
    { value: 'canceled', label: 'Abgesagt' },
];

export default function ShiftEdit({ shift, sites, users }: Props) {
    const normalized = 'data' in shift ? shift.data : shift;
    const assigned = Array.isArray(normalized.assignments)
        ? normalized.assignments.map((assignment) => assignment.user_id)
        : normalized.assignments?.data?.map((assignment) => assignment.user_id) ?? [];

    const { data, setData, put, processing, errors } = useForm({
        site_id: normalized.site_id,
        title: normalized.title ?? '',
        starts_at: normalized.starts_at?.slice(0, 16) ?? '',
        ends_at: normalized.ends_at?.slice(0, 16) ?? '',
        status: normalized.status,
        assigned_user_ids: assigned,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Schichten', href: shiftsRoute.index().url },
        { title: normalized.title ?? 'Schicht', href: shiftsRoute.edit(normalized.id).url },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(shiftsRoute.update(normalized.id).url, { data });
    };

    const toggleUser = (userId: number) => {
        setData(
            'assigned_user_ids',
            data.assigned_user_ids.includes(userId)
                ? data.assigned_user_ids.filter((id) => id !== userId)
                : [...data.assigned_user_ids, userId],
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schicht bearbeiten" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{normalized.title ?? 'Schicht'}</h1>
                        <p className="text-sm text-muted-foreground">Schichtdaten bearbeiten.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.delete(shiftsRoute.destroy(normalized.id).url)}
                        className="rounded-md border border-border px-4 py-2 text-sm text-rose-600"
                    >
                        Löschen
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                        {errors.site_id && <div className="mt-1 text-xs text-red-600">{errors.site_id}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Titel</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && <div className="mt-1 text-xs text-red-600">{errors.title}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Start</label>
                        <input
                            type="datetime-local"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.starts_at}
                            onChange={(e) => setData('starts_at', e.target.value)}
                        />
                        {errors.starts_at && <div className="mt-1 text-xs text-red-600">{errors.starts_at}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Ende</label>
                        <input
                            type="datetime-local"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.ends_at}
                            onChange={(e) => setData('ends_at', e.target.value)}
                        />
                        {errors.ends_at && <div className="mt-1 text-xs text-red-600">{errors.ends_at}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.status && <div className="mt-1 text-xs text-red-600">{errors.status}</div>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Mitarbeiter zuweisen</label>
                        <div className="mt-2 grid gap-2 rounded-md border border-border bg-background p-3 text-sm md:grid-cols-2">
                            {users.length === 0 ? (
                                <div className="text-xs text-muted-foreground">Keine Mitarbeiter vorhanden.</div>
                            ) : (
                                users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-border"
                                            checked={data.assigned_user_ids.includes(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                        />
                                        <span>
                                            {user.name} <span className="text-xs text-muted-foreground">({user.role ?? '—'})</span>
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                        {errors.assigned_user_ids && (
                            <div className="mt-1 text-xs text-red-600">{errors.assigned_user_ids}</div>
                        )}
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
