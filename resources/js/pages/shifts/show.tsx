import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import shiftsRoute from '@/routes/shifts';
import assignmentsRoute from '@/routes/api/v1/assignments';

type Assignment = {
    id: number;
    user_id: number;
    role: string | null;
    status: string;
    user?: { id: number; name: string; email: string } | null;
};

type Shift = {
    id: number;
    title: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    site?: { id: number; name: string } | null;
    assignments?: { data: Assignment[] } | Assignment[];
};

type Props = {
    shift: Shift;
    users: { id: number; name: string; email: string; role: string | null }[];
};

const breadcrumbs = (shift: Shift): BreadcrumbItem[] => [
    { title: 'Schichten', href: shiftsRoute.index().url },
    { title: shift.title ?? 'Schicht', href: shiftsRoute.show(shift.id).url },
];

export default function ShiftShow({ shift, users }: Props) {
    const assignments = Array.isArray(shift.assignments)
        ? shift.assignments
        : shift.assignments?.data ?? [];

    const { data, setData, post, processing, errors } = useForm({
        shift_id: shift.id,
        user_id: users[0]?.id ?? '',
        role: 'employee',
        status: 'assigned',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(assignmentsRoute.store().url);
    };

    const confirmDelete = () => {
        if (!window.confirm('Schicht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(shiftsRoute.destroy(shift.id).url, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(shift)}>
            <Head title="Schicht" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{shift.title ?? 'Schicht'}</h1>
                        <p className="text-sm text-muted-foreground">
                            {shift.site?.name ?? '—'} · {new Date(shift.starts_at).toLocaleString('de-DE')} –{' '}
                            {new Date(shift.ends_at).toLocaleString('de-DE')}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${statusClasses(shift.status)}`}>
                                {formatStatus(shift.status)}
                            </span>
                        </div>
                    </div>
                    <Link
                        href={shiftsRoute.edit(shift.id).url}
                        className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                        Bearbeiten
                    </Link>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                    >
                        Löschen
                    </button>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Zuweisungen</h2>
                    <div className="mt-4 space-y-2">
                        {assignments.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Zuweisungen vorhanden.</div>
                        ) : (
                            assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
                                >
                                    <div>
                                        <div className="text-sm font-medium text-foreground">
                                            {assignment.user?.name ?? 'Mitarbeiter'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{assignment.user?.email ?? '—'}</div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{assignment.role ?? '—'}</span>
                                        <button
                                            type="button"
                                            onClick={() => router.delete(assignmentsRoute.destroy(assignment.id).url, { preserveScroll: true })}
                                            className="text-rose-600"
                                        >
                                            Entfernen
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Mitarbeiter zuweisen</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-medium">Mitarbeiter</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', Number(e.target.value))}
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <div className="mt-1 text-xs text-red-600">{errors.user_id}</div>}
                        </div>
                        <div>
                            <label className="text-xs font-medium">Rolle</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium">Status</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Zuweisen
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}

function formatStatus(status: string) {
    switch (status) {
        case 'completed':
            return 'Abgeschlossen';
        case 'canceled':
            return 'Abgesagt';
        default:
            return 'Geplant';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'completed':
            return 'bg-emerald-500/15 text-emerald-600';
        case 'canceled':
            return 'bg-rose-500/15 text-rose-600';
        default:
            return 'bg-sky-500/15 text-sky-600';
    }
}
