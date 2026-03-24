import { Head, Link, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import absencesRoute from '@/routes/absences';
import { buildExportUrl } from '@/lib/utils';

type Absence = {
    id: number;
    user_id: number;
    user?: { id: number; name: string; email?: string | null } | null;
    type: string;
    starts_on: string;
    ends_on: string;
    status: string;
    notes: string | null;
    rule_flags?: string[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: { first: string | null; last: string | null; prev: string | null; next: string | null };
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: PaginationLink[];
    };
};

type Props = {
    absences: Paginated<Absence>;
    filters: {
        status: string;
        type: string;
        user_id: number | null;
        from: string;
        to: string;
        flag: string;
    };
    users: { id: number; name: string }[];
    canAssignUser: boolean;
    summary: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        flagged: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Abwesenheiten', href: absencesRoute.index().url },
];

const statusOptions = [
    { value: '', label: 'Alle' },
    { value: 'pending', label: 'Ausstehend' },
    { value: 'approved', label: 'Genehmigt' },
    { value: 'rejected', label: 'Abgelehnt' },
];

const typeOptions = [
    { value: '', label: 'Alle' },
    { value: 'vacation', label: 'Urlaub' },
    { value: 'sick', label: 'Krankheit' },
    { value: 'special', label: 'Sonderurlaub' },
];

const flagOptions = [
    { value: '', label: 'Alle' },
    { value: 'overlap', label: 'Überlappung' },
    { value: 'long_absence', label: 'Lange Abwesenheit' },
    { value: 'sick_without_note', label: 'Krank ohne Notiz' },
    { value: 'invalid_range', label: 'Ungültiger Zeitraum' },
];

export default function AbsencesIndex({ absences, filters, users, canAssignUser, summary }: Props) {
    const { data, setData, get } = useForm({
        status: filters.status ?? '',
        type: filters.type ?? '',
        user_id: filters.user_id ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
        flag: filters.flag ?? '',
    });

    const exportUrl = () => buildExportUrl(absencesRoute.export().url, data);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(absencesRoute.index().url, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setData({
            status: '',
            type: '',
            user_id: '',
            from: '',
            to: '',
            flag: '',
        });
        router.get(absencesRoute.index().url, {}, { replace: true });
    };

    const updateStatus = (absenceId: number, status: string) => {
        router.put(absencesRoute.update(absenceId).url, { status }, { preserveScroll: true });
    };

    const confirmDelete = (absenceId: number) => {
        if (!window.confirm('Abwesenheit wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(absencesRoute.destroy(absenceId).url, { preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Abwesenheiten" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Abwesenheiten</h1>
                    <p className="text-sm text-muted-foreground">Urlaub, Krankheit, Sonderurlaub.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Gesamt</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.total}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Ausstehend</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.pending}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Genehmigt</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.approved}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Abgelehnt</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.rejected}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Mit Flags</p>
                        <p className="mt-2 text-2xl font-semibold">{summary.flagged}</p>
                    </div>
                </div>
                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-6">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Status</label>
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
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Typ</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Flag</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.flag}
                                onChange={(e) => setData('flag', e.target.value)}
                            >
                                {flagOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {canAssignUser && (
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Mitarbeiter</label>
                                <select
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.user_id}
                                    onChange={(e) => setData('user_id', e.target.value)}
                                >
                                    <option value="">Alle</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Von</label>
                            <input
                                type="date"
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.from}
                                onChange={(e) => setData('from', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Bis</label>
                            <input
                                type="date"
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.to}
                                onChange={(e) => setData('to', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="submit"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Filtern
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            Zurücksetzen
                        </button>
                    </div>
                </form>
                <div className="flex flex-wrap justify-end gap-2">
                    {canAssignUser && (
                        <button
                            type="button"
                            onClick={() => window.open(exportUrl(), '_blank', 'noopener,noreferrer')}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            CSV Export
                        </button>
                    )}
                    <Link
                        href={absencesRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neue Abwesenheit
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Mitarbeiter</th>
                                <th className="px-4 py-3 text-left font-medium">Typ</th>
                                <th className="px-4 py-3 text-left font-medium">Start</th>
                                <th className="px-4 py-3 text-left font-medium">Ende</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Flags</th>
                                <th className="px-4 py-3 text-left font-medium">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absences.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                                        Keine Abwesenheiten vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                absences.data.map((absence) => (
                                    <tr key={absence.id} className="border-t border-border/60">
                                        <td className="px-4 py-3">
                                            {absence.user?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">{formatType(absence.type)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{absence.starts_on}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{absence.ends_on}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(absence.status)}`}>
                                                {formatStatus(absence.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {absence.rule_flags && absence.rule_flags.length > 0
                                                ? absence.rule_flags.join(', ')
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={absencesRoute.edit(absence.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                {canAssignUser && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateStatus(absence.id, 'approved')}
                                                            className="text-sm font-semibold text-emerald-600"
                                                        >
                                                            Genehmigen
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateStatus(absence.id, 'rejected')}
                                                            className="text-sm font-semibold text-rose-600"
                                                        >
                                                            Ablehnen
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(absence.id)}
                                                    className="text-sm font-semibold text-rose-600"
                                                >
                                                    Löschen
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {absences.meta.links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.url ?? '#'}
                            className={`rounded-md border px-3 py-1 text-sm ${
                                link.active
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground'
                            } ${link.url ? 'hover:border-primary/60' : 'pointer-events-none opacity-50'}`}
                            preserveScroll
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

function formatStatus(status: string) {
    switch (status) {
        case 'approved':
            return 'Genehmigt';
        case 'rejected':
            return 'Abgelehnt';
        default:
            return 'Ausstehend';
    }
}

function statusClasses(status: string) {
    switch (status) {
        case 'approved':
            return 'bg-emerald-500/15 text-emerald-600';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-600';
        default:
            return 'bg-amber-500/15 text-amber-600';
    }
}

function formatType(type: string) {
    switch (type) {
        case 'vacation':
            return 'Urlaub';
        case 'sick':
            return 'Krankheit';
        case 'special':
            return 'Sonderurlaub';
        default:
            return type;
    }
}
