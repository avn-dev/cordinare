import { Head, Link, useForm, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import shiftsRoute from '@/routes/shifts';
import assignmentsRoute from '@/routes/api/v1/assignments';

type Shift = {
    id: number;
    title: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    site?: { id: number; name: string } | null;
    assignments?: { data: { user_id: number }[] } | { user_id: number }[];
    is_template_preview?: boolean;
    template_id?: number;
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
    shifts: Paginated<Shift>;
    calendar: {
        view: 'month' | 'week' | 'day';
        month: string;
        date?: string | null;
        starts_on: string;
        ends_on: string;
        shifts: { data: Shift[] };
    };
    users: { id: number; name: string; email: string; role: string | null }[];
    sites: { id: number; name: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Schichten', href: shiftsRoute.index().url },
];

export default function ShiftsIndex({ shifts, calendar, users, sites }: Props) {
    const { data, setData, get } = useForm({
        month: calendar.month,
        date: calendar.date ?? '',
        view: calendar.view ?? 'month',
    });

    const confirmDelete = (shiftId: number) => {
        if (!window.confirm('Schicht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(shiftsRoute.destroy(shiftId).url, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(shiftsRoute.index().url, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schichten" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Schichten</h1>
                        <p className="text-sm text-muted-foreground">Geplante Schichten im Überblick.</p>
                    </div>
                    <Link
                        href={shiftsRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neue Schicht
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="rounded-md border border-border p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setData('view', 'month')}
                                className={`rounded-md px-3 py-1 ${
                                    data.view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                Monat
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('view', 'week')}
                                className={`rounded-md px-3 py-1 ${
                                    data.view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                Woche
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('view', 'day')}
                                className={`rounded-md px-3 py-1 ${
                                    data.view === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                                }`}
                            >
                                Tag
                            </button>
                        </div>
                        {data.view === 'month' ? (
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Monat</label>
                                <input
                                    type="month"
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.month}
                                    onChange={(e) => setData('month', e.target.value)}
                                    placeholder="YYYY-MM"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">
                                    {data.view === 'week' ? 'Woche (Datum)' : 'Tag (Datum)'}
                                </label>
                                <input
                                    type="date"
                                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Kalender laden
                        </button>
                    </div>
                </form>

                <CalendarView calendar={calendar} users={users} sites={sites} view={data.view} />

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Titel</th>
                                <th className="px-4 py-3 text-left font-medium">Objekt</th>
                                <th className="px-4 py-3 text-left font-medium">Start</th>
                                <th className="px-4 py-3 text-left font-medium">Ende</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                                        Keine Schichten vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                shifts.data.map((shift) => (
                                    <tr key={shift.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 font-medium text-foreground">{shift.title ?? `Schicht #${shift.id}`}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{shift.site?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {shift.starts_at ? new Date(shift.starts_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {shift.ends_at ? new Date(shift.ends_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses(shift.status)}`}>
                                                {formatStatus(shift.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    href={shiftsRoute.show(shift.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Öffnen
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(shift.id)}
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
                    {shifts.meta.links.map((link) => (
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

function CalendarView({
    calendar,
    users,
    sites,
    view,
}: {
    calendar: Props['calendar'];
    users: Props['users'];
    sites: Props['sites'];
    view: 'month' | 'week' | 'day';
}) {
    const [hoverDate, setHoverDate] = useState<string | null>(null);
    const weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const monthStart = new Date(`${calendar.month}-01T00:00:00`);
    const month = monthStart.getMonth();
    const year = monthStart.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (monthStart.getDay() + 6) % 7; // Monday-based

    const shiftsByDay = new Map<string, Shift[]>();
    const shiftById = new Map<number, Shift>();
    calendar.shifts.data.forEach((shift) => {
        shiftById.set(shift.id, shift);
        const date = new Date(shift.starts_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const existing = shiftsByDay.get(key) ?? [];
        existing.push(shift);
        shiftsByDay.set(key, existing);
    });

    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
        cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ date, day });
    }

    const quickDefaults = {
        site_id: sites[0]?.id ?? '',
        title: '',
        starts_at: '',
        ends_at: '',
        status: 'scheduled',
        assigned_user_ids: [] as number[],
    };

    const { data: quickData, setData: setQuickData, post: quickPost, processing: quickProcessing, errors: quickErrors } = useForm(quickDefaults);
    const { data: editData, setData: setEditData, put: editPut, processing: editProcessing, errors: editErrors } = useForm({
        id: null as number | null,
        site_id: sites[0]?.id ?? '',
        title: '',
        starts_at: '',
        ends_at: '',
        status: 'scheduled',
        assigned_user_ids: [] as number[],
    });
    const { data: assignData, setData: setAssignData, post: assignPost, processing: assignProcessing, errors: assignErrors } = useForm({
        shift_id: '',
        user_id: users[0]?.id ?? '',
        role: 'employee',
        status: 'assigned',
    });

    const openQuickCreate = (date: string) => {
        const starts = `${date}T08:00`;
        const ends = `${date}T12:00`;
        setQuickData({
            ...quickDefaults,
            site_id: sites[0]?.id ?? '',
            starts_at: starts,
            ends_at: ends,
        });
        const dialog = document.getElementById('shift-quick-create') as HTMLDialogElement | null;
        dialog?.showModal();
    };

    const submitQuickCreate = (event: FormEvent) => {
        event.preventDefault();
        quickPost(shiftsRoute.store().url, {
            data: { ...quickData, quick: true },
            headers: { 'X-Shift-Quick': '1' },
            onSuccess: () => {
                const dialog = document.getElementById('shift-quick-create') as HTMLDialogElement | null;
                dialog?.close();
            },
        });
    };

    const openAssign = (shiftId: number) => {
        setAssignData({
            shift_id: shiftId,
            user_id: users[0]?.id ?? '',
            role: 'employee',
            status: 'assigned',
        });
        const dialog = document.getElementById('shift-quick-assign') as HTMLDialogElement | null;
        dialog?.showModal();
    };

    const openEdit = (shift: Shift) => {
        const assigned = Array.isArray(shift.assignments)
            ? shift.assignments.map((assignment) => assignment.user_id)
            : shift.assignments?.data?.map((assignment) => assignment.user_id) ?? [];

        setEditData({
            id: shift.id,
            site_id: shift.site?.id ?? sites[0]?.id ?? '',
            title: shift.title ?? '',
            starts_at: shift.starts_at?.slice(0, 16) ?? '',
            ends_at: shift.ends_at?.slice(0, 16) ?? '',
            status: shift.status ?? 'scheduled',
            assigned_user_ids: assigned,
        });

        const dialog = document.getElementById('shift-quick-edit') as HTMLDialogElement | null;
        dialog?.showModal();
    };

    const submitAssign = (event: FormEvent) => {
        event.preventDefault();
        assignPost(assignmentsRoute.store().url, {
            onSuccess: () => {
                const dialog = document.getElementById('shift-quick-assign') as HTMLDialogElement | null;
                dialog?.close();
            },
        });
    };

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();
        if (!editData.id) return;
        editPut(shiftsRoute.update(editData.id).url, {
            data: { ...editData, quick: true },
            headers: { 'X-Shift-Quick': '1' },
            onSuccess: () => {
                const dialog = document.getElementById('shift-quick-edit') as HTMLDialogElement | null;
                dialog?.close();
            },
        });
    };

    const confirmDelete = (shiftId: number) => {
        if (!window.confirm('Schicht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            return;
        }
        router.delete(shiftsRoute.destroy(shiftId).url, {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    };

    const mergeDateWithTime = (date: string, source: string) => {
        const src = new Date(source);
        if (Number.isNaN(src.getTime())) {
            return `${date}T08:00`;
        }
        const hh = String(src.getHours()).padStart(2, '0');
        const mm = String(src.getMinutes()).padStart(2, '0');
        return `${date}T${hh}:${mm}`;
    };

    const formatDateTimeLocal = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };

    const moveShift = (shiftId: number, date: string) => {
        const shift = shiftById.get(shiftId);
        if (!shift) return;
        const assigned = Array.isArray(shift.assignments)
            ? shift.assignments.map((assignment) => assignment.user_id)
            : shift.assignments?.data?.map((assignment) => assignment.user_id) ?? [];

        router.put(
            shiftsRoute.update(shift.id).url,
            {
                site_id: shift.site?.id ?? sites[0]?.id ?? '',
                title: shift.title ?? '',
                starts_at: mergeDateWithTime(date, shift.starts_at),
                ends_at: mergeDateWithTime(date, shift.ends_at),
                status: shift.status ?? 'scheduled',
                assigned_user_ids: assigned,
                quick: true,
            },
            { preserveScroll: true, preserveState: false, replace: true, headers: { 'X-Shift-Quick': '1' } },
        );
    };

    const moveShiftToTime = (shiftId: number, date: string, hour: number, minute: number) => {
        const shift = shiftById.get(shiftId);
        if (!shift) return;
        const assigned = Array.isArray(shift.assignments)
            ? shift.assignments.map((assignment) => assignment.user_id)
            : shift.assignments?.data?.map((assignment) => assignment.user_id) ?? [];

        const start = new Date(shift.starts_at);
        const end = new Date(shift.ends_at);
        let durationMinutes = Math.max(60, Math.floor((end.getTime() - start.getTime()) / 60000));
        if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
            durationMinutes = 60;
        }

        const newStart = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
        const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

        router.put(
            shiftsRoute.update(shift.id).url,
            {
                site_id: shift.site?.id ?? sites[0]?.id ?? '',
                title: shift.title ?? '',
                starts_at: formatDateTimeLocal(newStart),
                ends_at: formatDateTimeLocal(newEnd),
                status: shift.status ?? 'scheduled',
                assigned_user_ids: assigned,
                quick: true,
            },
            { preserveScroll: true, preserveState: false, replace: true, headers: { 'X-Shift-Quick': '1' } },
        );
    };

    const updateShiftTimes = (shiftId: number, startsAt: string, endsAt: string) => {
        const shift = shiftById.get(shiftId);
        if (!shift) return;
        const assigned = Array.isArray(shift.assignments)
            ? shift.assignments.map((assignment) => assignment.user_id)
            : shift.assignments?.data?.map((assignment) => assignment.user_id) ?? [];

        router.put(
            shiftsRoute.update(shift.id).url,
            {
                site_id: shift.site?.id ?? sites[0]?.id ?? '',
                title: shift.title ?? '',
                starts_at: startsAt,
                ends_at: endsAt,
                status: shift.status ?? 'scheduled',
                assigned_user_ids: assigned,
                quick: true,
            },
            { preserveScroll: true, preserveState: false, replace: true, headers: { 'X-Shift-Quick': '1' } },
        );
    };

    const weekStart = new Date(`${calendar.starts_on}T00:00:00`);

    return (
        <div className="rounded-xl border border-border/60 bg-background p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Kalender</h2>
                <span className="text-xs text-muted-foreground">
                    {calendar.starts_on} – {calendar.ends_on}
                </span>
            </div>

            {view === 'month' ? (
                <>
                    <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-muted-foreground">
                        {weekdayLabels.map((label) => (
                            <div key={label} className="text-center font-semibold">
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-2">
                        {cells.map((cell, index) => {
                            if (! cell) {
                                return <div key={`empty-${index}`} className="min-h-[110px] rounded-lg border border-transparent" />;
                            }

                            const shiftsForDay = shiftsByDay.get(cell.date) ?? [];

                            return (
                                <div
                                    key={cell.date}
                                    className={`min-h-[110px] rounded-lg border border-border/60 bg-muted/20 p-2 ${
                                        hoverDate === cell.date ? 'ring-2 ring-primary/30' : ''
                                    }`}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDragEnter={() => setHoverDate(cell.date)}
                                    onDragLeave={() => setHoverDate((current) => (current === cell.date ? null : current))}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        const payload = event.dataTransfer.getData('text/plain');
                                        const id = payload ? Number(payload) : null;
                                        if (id) {
                                            moveShift(id, cell.date);
                                        }
                                        setHoverDate(null);
                                    }}
                                >
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{cell.day}</span>
                                        {shiftsForDay.length > 0 && (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                                {shiftsForDay.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {shiftsForDay.length === 0 ? (
                                            <div className="text-[11px] text-muted-foreground">—</div>
                                        ) : (
                                    shiftsForDay.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className={`rounded-md border px-2 py-1 text-[11px] text-foreground hover:border-primary/60 ${
                                                    shift.is_template_preview
                                                        ? 'border-dashed border-emerald-300 bg-emerald-50/40'
                                                        : 'border-border/60 bg-background'
                                                }`}
                                                draggable={!shift.is_template_preview}
                                                onDragStart={(event) => {
                                                    if (shift.is_template_preview) return;
                                                    event.dataTransfer.setData('text/plain', String(shift.id));
                                                }}
                                                title={buildShiftTooltip(shift)}
                                            >
                                            {shift.is_template_preview ? (
                                                <div className="block">
                                                    <div className="font-medium">
                                                        {shift.title ?? 'Schicht'}
                                                        <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                            Vorlage
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {formatTime(shift.starts_at)}–{formatTime(shift.ends_at)}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {shift.site?.name ?? '—'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Link href={shiftsRoute.show(shift.id).url} className="block">
                                                <div className="font-medium">
                                                    {shift.title ?? 'Schicht'}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {formatTime(shift.starts_at)}–{formatTime(shift.ends_at)}
                                                </div>
                                                <div className="mt-1 inline-flex items-center gap-1">
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(shift.status)}`}>
                                                        {formatStatus(shift.status)}
                                                    </span>
                                                </div>
                                                {isMultiDay(shift) && (
                                                    <div className="text-[10px] text-amber-600">
                                                        Mehrtägig bis {formatDate(shift.ends_at)} {formatTime(shift.ends_at)}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-muted-foreground">
                                                    {shift.site?.name ?? '—'}
                                                </div>
                                                </Link>
                                            )}
                                            {!shift.is_template_preview && (
                                                <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold">
                                                    <button type="button" onClick={() => openAssign(shift.id)} className="text-emerald-600">
                                                        + Mitarbeiter
                                                    </button>
                                                    <button type="button" onClick={() => openEdit(shift)} className="text-slate-600">
                                                        Bearbeiten
                                                    </button>
                                                    <button type="button" onClick={() => confirmDelete(shift.id)} className="text-rose-600">
                                                        Löschen
                                                    </button>
                                                </div>
                                            )}
                                                </div>
                                            ))
                                        )}
                            </div>
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() => openQuickCreate(cell.date)}
                                            className="text-[11px] font-semibold text-emerald-600"
                                        >
                                            + Schicht
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : view === 'week' ? (
                <div className="mt-4 grid grid-cols-7 gap-2">
                    {weekdayLabels.map((label, index) => {
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(dayDate.getDate() + index);
                        const dayKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                        const shiftsForDay = shiftsByDay.get(dayKey) ?? [];

                        return (
                            <div
                                key={label}
                                className={`rounded-lg border border-border/60 bg-muted/10 p-2 ${
                                    hoverDate === dayKey ? 'ring-2 ring-primary/30' : ''
                                }`}
                                onDragOver={(event) => event.preventDefault()}
                                onDragEnter={() => setHoverDate(dayKey)}
                                onDragLeave={() => setHoverDate((current) => (current === dayKey ? null : current))}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    const payload = event.dataTransfer.getData('text/plain');
                                    const id = payload ? Number(payload) : null;
                                    if (id) {
                                        moveShift(id, dayKey);
                                    }
                                    setHoverDate(null);
                                }}
                            >
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-semibold">
                                        {label} {dayDate.getDate()}
                                    </span>
                                    {shiftsForDay.length > 0 && (
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                                            {shiftsForDay.length}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 space-y-2">
                                    {shiftsForDay.length === 0 ? (
                                        <div className="text-[11px] text-muted-foreground">—</div>
                                    ) : (
                                        shiftsForDay.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className={`rounded-md border px-2 py-2 text-[11px] text-foreground ${
                                                    shift.is_template_preview
                                                        ? 'border-dashed border-emerald-300 bg-emerald-50/40'
                                                        : 'border-border/60 bg-background'
                                                }`}
                                                draggable={!shift.is_template_preview}
                                                onDragStart={(event) => {
                                                    if (shift.is_template_preview) return;
                                                    event.dataTransfer.setData('text/plain', String(shift.id));
                                                }}
                                                title={buildShiftTooltip(shift)}
                                            >
                                                {shift.is_template_preview ? (
                                                    <div className="block">
                                                        <div className="font-medium">
                                                            {formatTime(shift.starts_at)}–{formatTime(shift.ends_at)}
                                                            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                                Vorlage
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {shift.title ?? 'Schicht'}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {shift.site?.name ?? '—'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Link href={shiftsRoute.show(shift.id).url} className="block">
                                                    <div className="font-medium">
                                                        {formatTime(shift.starts_at)}–{formatTime(shift.ends_at)}
                                                    </div>
                                                    <div className="mt-1 inline-flex items-center gap-1">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(shift.status)}`}>
                                                            {formatStatus(shift.status)}
                                                        </span>
                                                    </div>
                                                    {isMultiDay(shift) && (
                                                        <div className="text-[10px] text-amber-600">
                                                            Mehrtägig bis {formatDate(shift.ends_at)}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {shift.title ?? 'Schicht'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {shift.site?.name ?? '—'}
                                                    </div>
                                                    </Link>
                                                )}
                                                {!shift.is_template_preview && (
                                                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold">
                                                        <button type="button" onClick={() => openAssign(shift.id)} className="text-emerald-600">
                                                            + Mitarbeiter
                                                        </button>
                                                        <button type="button" onClick={() => openEdit(shift)} className="text-slate-600">
                                                            Bearbeiten
                                                        </button>
                                                        <button type="button" onClick={() => confirmDelete(shift.id)} className="text-rose-600">
                                                            Löschen
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => openQuickCreate(dayKey)}
                                        className="text-[11px] font-semibold text-emerald-600"
                                    >
                                        + Schicht
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <DayView
                    date={calendar.date ?? calendar.starts_on}
                    shifts={calendar.shifts.data}
                    openAssign={openAssign}
                    openEdit={openEdit}
                    openQuickCreate={openQuickCreate}
                    moveShift={moveShift}
                    moveShiftToTime={moveShiftToTime}
                    updateShiftTimes={updateShiftTimes}
                    onDelete={confirmDelete}
                    hoverDate={hoverDate}
                    setHoverDate={setHoverDate}
                />
            )}

            <dialog
                id="shift-quick-create"
                className="w-[min(92vw,420px)] rounded-xl border border-border bg-background p-0 text-sm text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
            >
                <form onSubmit={submitQuickCreate} className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Schicht anlegen</h3>
                        <button type="button" onClick={() => (document.getElementById('shift-quick-create') as HTMLDialogElement | null)?.close()}>
                            Schließen
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Objekt</label>
                            <select
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={quickData.site_id}
                                onChange={(e) => setQuickData('site_id', Number(e.target.value))}
                            >
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                            {quickErrors.site_id && <div className="mt-1 text-xs text-red-600">{quickErrors.site_id}</div>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Titel</label>
                            <input
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={quickData.title}
                                onChange={(e) => setQuickData('title', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Start</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={quickData.starts_at}
                                    onChange={(e) => setQuickData('starts_at', e.target.value)}
                                />
                                {quickErrors.starts_at && <div className="mt-1 text-xs text-red-600">{quickErrors.starts_at}</div>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Ende</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={quickData.ends_at}
                                    onChange={(e) => setQuickData('ends_at', e.target.value)}
                                />
                                {quickErrors.ends_at && <div className="mt-1 text-xs text-red-600">{quickErrors.ends_at}</div>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Mitarbeiter</label>
                            <div className="mt-1 grid gap-2 rounded-md border border-border bg-background p-2 text-xs sm:grid-cols-2">
                                {users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={quickData.assigned_user_ids.includes(user.id)}
                                            onChange={() =>
                                                setQuickData(
                                                    'assigned_user_ids',
                                                    quickData.assigned_user_ids.includes(user.id)
                                                        ? quickData.assigned_user_ids.filter((id) => id !== user.id)
                                                        : [...quickData.assigned_user_ids, user.id],
                                                )
                                            }
                                        />
                                        <span>{user.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={quickProcessing}
                            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                        >
                            Speichern
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog
                id="shift-quick-assign"
                className="w-[min(92vw,420px)] rounded-xl border border-border bg-background p-0 text-sm text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
            >
                <form onSubmit={submitAssign} className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Mitarbeiter zuweisen</h3>
                        <button type="button" onClick={() => (document.getElementById('shift-quick-assign') as HTMLDialogElement | null)?.close()}>
                            Schließen
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Mitarbeiter</label>
                            <select
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={assignData.user_id}
                                onChange={(e) => setAssignData('user_id', Number(e.target.value))}
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {assignErrors.user_id && <div className="mt-1 text-xs text-red-600">{assignErrors.user_id}</div>}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Rolle</label>
                                <input
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={assignData.role}
                                    onChange={(e) => setAssignData('role', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                                <input
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={assignData.status}
                                    onChange={(e) => setAssignData('status', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={assignProcessing}
                            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                        >
                            Zuweisen
                        </button>
                    </div>
                </form>
            </dialog>

            <dialog
                id="shift-quick-edit"
                className="w-[min(92vw,460px)] rounded-xl border border-border bg-background p-0 text-sm text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
            >
                <form onSubmit={submitEdit} className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Schicht bearbeiten</h3>
                        <button type="button" onClick={() => (document.getElementById('shift-quick-edit') as HTMLDialogElement | null)?.close()}>
                            Schließen
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Objekt</label>
                            <select
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={editData.site_id}
                                onChange={(e) => setEditData('site_id', Number(e.target.value))}
                            >
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                            {editErrors.site_id && <div className="mt-1 text-xs text-red-600">{editErrors.site_id}</div>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Titel</label>
                            <input
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={editData.title}
                                onChange={(e) => setEditData('title', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Start</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={editData.starts_at}
                                    onChange={(e) => setEditData('starts_at', e.target.value)}
                                />
                                {editErrors.starts_at && <div className="mt-1 text-xs text-red-600">{editErrors.starts_at}</div>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Ende</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    value={editData.ends_at}
                                    onChange={(e) => setEditData('ends_at', e.target.value)}
                                />
                                {editErrors.ends_at && <div className="mt-1 text-xs text-red-600">{editErrors.ends_at}</div>}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Status</label>
                            <select
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={editData.status}
                                onChange={(e) => setEditData('status', e.target.value)}
                            >
                                <option value="scheduled">Geplant</option>
                                <option value="completed">Abgeschlossen</option>
                                <option value="canceled">Abgesagt</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Mitarbeiter</label>
                            <div className="mt-1 grid gap-2 rounded-md border border-border bg-background p-2 text-xs sm:grid-cols-2">
                                {users.map((user) => (
                                    <label key={user.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editData.assigned_user_ids.includes(user.id)}
                                            onChange={() =>
                                                setEditData(
                                                    'assigned_user_ids',
                                                    editData.assigned_user_ids.includes(user.id)
                                                        ? editData.assigned_user_ids.filter((id) => id !== user.id)
                                                        : [...editData.assigned_user_ids, user.id],
                                                )
                                            }
                                        />
                                        <span>{user.name}</span>
                                    </label>
                                ))}
                            </div>
                            {editErrors.assigned_user_ids && (
                                <div className="mt-1 text-xs text-red-600">{editErrors.assigned_user_ids}</div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={editProcessing}
                            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                        >
                            Speichern
                        </button>
                    </div>
                </form>
            </dialog>
        </div>
    );
}

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--:--';
    }
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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

function buildShiftTooltip(shift: Shift) {
    const title = shift.title ?? 'Schicht';
    const site = shift.site?.name ?? '—';
    const start = formatTime(shift.starts_at);
    const end = formatTime(shift.ends_at);
    const status = shift.is_template_preview ? 'Vorlage' : formatStatus(shift.status);
    return `${title}\n${site}\n${start}–${end}\n${status}`;
}

function formatDateTimeLocal(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--.--';
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function isMultiDay(shift: { starts_at: string; ends_at: string }) {
    const start = new Date(shift.starts_at);
    const end = new Date(shift.ends_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return false;
    }
    return (
        start.getFullYear() !== end.getFullYear() ||
        start.getMonth() !== end.getMonth() ||
        start.getDate() !== end.getDate()
    );
}

function DayView({
    date,
    shifts,
    openAssign,
    openEdit,
    openQuickCreate,
    moveShift,
    moveShiftToTime,
    updateShiftTimes,
    onDelete,
    hoverDate,
    setHoverDate,
}: {
    date: string;
    shifts: Shift[];
    openAssign: (shiftId: number) => void;
    openEdit: (shift: Shift) => void;
    openQuickCreate: (date: string) => void;
    moveShift: (shiftId: number, date: string) => void;
    moveShiftToTime: (shiftId: number, date: string, hour: number, minute: number) => void;
    updateShiftTimes: (shiftId: number, startsAt: string, endsAt: string) => void;
    onDelete: (shiftId: number) => void;
    hoverDate: string | null;
    setHoverDate: (value: string | null) => void;
}) {
    const dayKey = date;
    const startHour = 7;
    const endHour = 19;
    const slotCount = endHour - startHour;
    const slots = Array.from({ length: slotCount }, (_, index) => startHour + index); // 07:00 - 18:00
    const minutesTotal = slotCount * 60;
    const pxPerMinute = 1;
    const [gridStep, setGridStep] = useState(15);
    const timelineHeight = minutesTotal * pxPerMinute;
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const [draggingShiftId, setDraggingShiftId] = useState<number | null>(null);
    const [dragPreview, setDragPreview] = useState<{ top: number; height: number } | null>(null);
    const [resizing, setResizing] = useState<{
        id: number;
        edge: 'start' | 'end';
    } | null>(null);
    const [previewTimes, setPreviewTimes] = useState<Record<number, { starts_at: string; ends_at: string }>>({});
    const pendingRef = useRef<{ id: number; starts_at: string; ends_at: string } | null>(null);
    const shiftsForDay = shifts.filter((shift) => {
        const start = new Date(shift.starts_at);
        const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        return key === dayKey;
    });

    const layout = buildOverlapLayout(shiftsForDay, previewTimes, startHour);

    useEffect(() => {
        if (!resizing) return;

        const handleMove = (event: PointerEvent) => {
            const container = timelineRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const offsetY = Math.max(0, Math.min(event.clientY - rect.top, timelineHeight));
            const minutesFromStart = Math.round(offsetY / gridStep) * gridStep;
            const baseHour = startHour + Math.floor(minutesFromStart / 60);
            const baseMinute = minutesFromStart % 60;

            const shift = shiftsForDay.find((item) => item.id === resizing.id);
            if (!shift) return;
            const start = new Date(shift.starts_at);
            const end = new Date(shift.ends_at);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

            const newTime = new Date(start);
            newTime.setHours(baseHour, baseMinute, 0, 0);
            let newStart = start;
            let newEnd = end;

            if (resizing.edge === 'start') {
                newStart = newTime;
                if (newStart >= newEnd) {
                    newStart = new Date(newEnd.getTime() - 30 * 60000);
                }
            } else {
                newEnd = newTime;
                if (newEnd <= newStart) {
                    newEnd = new Date(newStart.getTime() + 30 * 60000);
                }
            }

            const startsAt = formatDateTimeLocal(newStart);
            const endsAt = formatDateTimeLocal(newEnd);
            pendingRef.current = { id: resizing.id, starts_at: startsAt, ends_at: endsAt };
            setPreviewTimes((current) => ({
                ...current,
                [resizing.id]: { starts_at: startsAt, ends_at: endsAt },
            }));
        };

        const handleUp = () => {
            if (pendingRef.current) {
                updateShiftTimes(
                    pendingRef.current.id,
                    pendingRef.current.starts_at,
                    pendingRef.current.ends_at,
                );
                pendingRef.current = null;
            }
            setPreviewTimes((current) => {
                const next = { ...current };
                if (resizing) {
                    delete next[resizing.id];
                }
                return next;
            });
            setResizing(null);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });

        return () => {
            window.removeEventListener('pointermove', handleMove);
        };
    }, [resizing, shiftsForDay, startHour, timelineHeight, updateShiftTimes, gridStep]);

    return (
        <div
            className={`mt-4 rounded-xl border border-border/60 bg-background p-4 ${
                hoverDate === dayKey ? 'ring-2 ring-primary/30' : ''
            }`}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => setHoverDate(dayKey)}
            onDragLeave={() => setHoverDate((current) => (current === dayKey ? null : current))}
            onDrop={(event) => {
                event.preventDefault();
                const payload = event.dataTransfer.getData('text/plain');
                const id = payload ? Number(payload) : null;
                if (id) {
                    moveShift(id, dayKey);
                }
                setHoverDate(null);
            }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold">Tagesansicht</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        Raster
                        <select
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                            value={gridStep}
                            onChange={(event) => setGridStep(Number(event.target.value))}
                        >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={60}>60 min</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={() => openQuickCreate(dayKey)}
                        className="text-xs font-semibold text-emerald-600"
                    >
                        + Schicht
                    </button>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-[64px_1fr] gap-3">
                <div className="relative">
                    {slots.map((hour) => (
                        <div key={hour} className="h-[60px] text-xs text-muted-foreground">
                            {String(hour).padStart(2, '0')}:00
                        </div>
                    ))}
                </div>
                <div
                    ref={timelineRef}
                    className="relative rounded-md border border-border/60 bg-muted/10"
                    style={{ height: timelineHeight }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        if (!draggingShiftId) return;
                        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const offsetY = Math.max(0, Math.min(event.clientY - rect.top, timelineHeight));
                        const minutesFromStart = Math.round(offsetY / gridStep) * gridStep;
                        const top = Math.max(0, Math.min(minutesFromStart, minutesTotal));
                        const dragged = shiftsForDay.find((item) => item.id === draggingShiftId);
                        if (!dragged) return;
                        const preview = previewTimes[dragged.id];
                        const start = new Date(preview?.starts_at ?? dragged.starts_at);
                        const end = new Date(preview?.ends_at ?? dragged.ends_at);
                        const durationMinutes = Math.max(30, Math.floor((end.getTime() - start.getTime()) / 60000));
                        setDragPreview({ top, height: Math.min(durationMinutes, minutesTotal - top) });
                    }}
                    onDragLeave={() => setDragPreview(null)}
                    onDrop={(event) => {
                        event.preventDefault();
                        const payload = event.dataTransfer.getData('text/plain');
                        const id = payload ? Number(payload) : null;
                        if (!id) return;
                        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                        const offsetY = Math.max(0, Math.min(event.clientY - rect.top, timelineHeight));
                        const minutesFromStart = Math.round(offsetY / gridStep) * gridStep;
                        const hour = startHour + Math.floor(minutesFromStart / 60);
                        const minute = minutesFromStart % 60;
                        moveShiftToTime(id, dayKey, hour, minute);
                        setDragPreview(null);
                        setDraggingShiftId(null);
                    }}
                >
                    {dragPreview && (
                        <div
                            className="pointer-events-none absolute left-2 right-2 rounded-md border border-primary/40 bg-primary/10"
                            style={{ top: dragPreview.top, height: dragPreview.height }}
                        />
                    )}
                    {Array.from({ length: Math.floor(minutesTotal / gridStep) + 1 }, (_, index) => {
                        const top = index * gridStep;
                        if (top % 60 === 0) return null;
                        return (
                            <div
                                key={`minor-${top}`}
                                className="absolute left-0 right-0 border-t border-dashed border-border/30"
                                style={{ top }}
                            />
                        );
                    })}
                    {slots.map((hour) => (
                        <div
                            key={`grid-${hour}`}
                            className="absolute left-0 right-0 border-t border-dashed border-border/60"
                            style={{ top: (hour - startHour) * 60 }}
                        />
                    ))}

                    {shiftsForDay.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                            Keine Schichten für diesen Tag.
                        </div>
                    ) : (
                        shiftsForDay.map((shift) => {
                            const preview = previewTimes[shift.id];
                            const start = new Date(preview?.starts_at ?? shift.starts_at);
                            const end = new Date(preview?.ends_at ?? shift.ends_at);
                            const startMinutes =
                                (start.getHours() - startHour) * 60 + start.getMinutes();
                            const durationMinutes = Math.max(
                                30,
                                Math.floor((end.getTime() - start.getTime()) / 60000),
                            );
                            const top = Math.max(0, startMinutes);
                            const height = Math.min(durationMinutes, minutesTotal - top);

                            const meta = layout.get(shift.id) ?? { col: 0, cols: 1 };
                            const colWidth = 100 / meta.cols;
                            const left = `calc(${meta.col * colWidth}% + 4px)`;
                            const width = `calc(${colWidth}% - 8px)`;

                            return (
                                <div
                                    key={shift.id}
                                    className={`absolute rounded-md border px-3 py-2 text-xs shadow-sm ${
                                        shift.is_template_preview
                                            ? 'border-dashed border-emerald-300 bg-emerald-50/40'
                                            : 'border-border/60 bg-background'
                                    }`}
                                    style={{ top, height, left, width }}
                                    draggable={!shift.is_template_preview}
                                    onDragStart={(event) => {
                                        if (shift.is_template_preview) return;
                                        event.dataTransfer.setData('text/plain', String(shift.id));
                                        setDraggingShiftId(shift.id);
                                        try {
                                            const ghost = document.createElement('div');
                                            ghost.style.position = 'absolute';
                                            ghost.style.top = '-9999px';
                                            ghost.style.left = '-9999px';
                                            ghost.style.width = '160px';
                                            ghost.style.padding = '8px';
                                            ghost.style.borderRadius = '8px';
                                            ghost.style.background = '#0f172a';
                                            ghost.style.color = '#fff';
                                            ghost.style.fontSize = '12px';
                                            ghost.style.boxShadow = '0 10px 25px rgba(0,0,0,.3)';
                                            ghost.textContent = shift.title ?? 'Schicht';
                                            document.body.appendChild(ghost);
                                            event.dataTransfer.setDragImage(ghost, 80, 20);
                                            setTimeout(() => ghost.remove(), 0);
                                        } catch {
                                            // noop
                                        }
                                    }}
                                    onDragEnd={() => {
                                        setDraggingShiftId(null);
                                        setDragPreview(null);
                                    }}
                                    title={buildShiftTooltip(shift)}
                                >
                                    {!shift.is_template_preview && (
                                        <>
                                            <button
                                                type="button"
                                                className="absolute left-2 right-2 top-0 h-1 cursor-ns-resize rounded-full bg-border"
                                                onPointerDown={(event) => {
                                                    event.stopPropagation();
                                                    setResizing({ id: shift.id, edge: 'start' });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="absolute left-2 right-2 bottom-0 h-1 cursor-ns-resize rounded-full bg-border"
                                                onPointerDown={(event) => {
                                                    event.stopPropagation();
                                                    setResizing({ id: shift.id, edge: 'end' });
                                                }}
                                            />
                                        </>
                                    )}
                                    <div className="font-semibold">{shift.title ?? 'Schicht'}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {formatTime(shift.starts_at)}–{formatTime(shift.ends_at)}
                                    </div>
                                    <div className="mt-1 inline-flex items-center gap-1">
                                        {shift.is_template_preview ? (
                                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                Vorlage
                                            </span>
                                        ) : (
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses(shift.status)}`}>
                                                {formatStatus(shift.status)}
                                            </span>
                                        )}
                                    </div>
                                    {isMultiDay(shift) && (
                                        <div className="text-[11px] text-amber-600">
                                            Mehrtägig bis {formatDate(shift.ends_at)}
                                        </div>
                                    )}
                                    {!shift.is_template_preview && (
                                        <div className="mt-1 flex gap-2 text-[11px] font-semibold">
                                            <button type="button" onClick={() => openAssign(shift.id)} className="text-emerald-600">
                                                + Mitarbeiter
                                            </button>
                                            <button type="button" onClick={() => openEdit(shift)} className="text-slate-600">
                                                Bearbeiten
                                            </button>
                                            <button type="button" onClick={() => onDelete(shift.id)} className="text-rose-600">
                                                Löschen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function buildOverlapLayout(
    shifts: Shift[],
    previewTimes: Record<number, { starts_at: string; ends_at: string }>,
    startHour: number,
) {
    const items = shifts
        .map((shift) => {
            const preview = previewTimes[shift.id];
            const start = new Date(preview?.starts_at ?? shift.starts_at);
            const end = new Date(preview?.ends_at ?? shift.ends_at);
            const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
            const endMinutes = Math.max(startMinutes + 30, (end.getHours() - startHour) * 60 + end.getMinutes());
            return {
                id: shift.id,
                start: startMinutes,
                end: endMinutes,
            };
        })
        .filter((item) => !Number.isNaN(item.start) && !Number.isNaN(item.end))
        .sort((a, b) => a.start - b.start || a.end - b.end);

    const layout = new Map<number, { col: number; cols: number }>();
    const active: Array<{ id: number; end: number; col: number }> = [];
    const usedCols: boolean[] = [];

    const cleanupActive = (time: number) => {
        for (let i = active.length - 1; i >= 0; i -= 1) {
            if (active[i].end <= time) {
                usedCols[active[i].col] = false;
                active.splice(i, 1);
            }
        }
    };

    for (const item of items) {
        cleanupActive(item.start);
        let col = usedCols.findIndex((value) => !value);
        if (col === -1) {
            col = usedCols.length;
        }
        usedCols[col] = true;
        active.push({ id: item.id, end: item.end, col });
        layout.set(item.id, { col, cols: Math.max(usedCols.length, 1) });
    }

    // Compute max column count for each overlap group
    for (const item of items) {
        let maxCols = 1;
        for (const other of items) {
            if (other.start < item.end && other.end > item.start) {
                const meta = layout.get(other.id);
                if (meta) {
                    maxCols = Math.max(maxCols, meta.cols);
                }
            }
        }
        const current = layout.get(item.id);
        if (current) {
            layout.set(item.id, { ...current, cols: maxCols });
        }
    }

    return layout;
}
