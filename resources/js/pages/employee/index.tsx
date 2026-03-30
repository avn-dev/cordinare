import { Head, useForm, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import employeeRoute from '@/routes/employee';
import absencesRoute from '@/routes/absences';
import { postCheckIn, postCheckOut } from '@/lib/employee-checkin';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mein Bereich', href: employeeRoute.portal().url },
];

type Shift = {
    id: number;
    title: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    has_time_entry?: boolean;
    is_open?: boolean;
    checked_in_at?: string | null;
    checked_out_at?: string | null;
    site?: { id: number; name: string } | null;
};

type TimeEntry = {
    id: number;
    shift_id: number;
    check_in_at: string | null;
    check_out_at: string | null;
    break_minutes: number | null;
    notes: string | null;
    worked_minutes: number | null;
    shift?: {
        id: number;
        title: string | null;
        starts_at: string | null;
        ends_at: string | null;
        site?: { id: number; name: string } | null;
    } | null;
};

type Absence = {
    id: number;
    type: string;
    status: string;
    starts_on: string;
    ends_on: string;
    notes: string | null;
};

type Props = {
    upcoming_shifts: Shift[];
    today_shifts: Shift[];
    open_entry: TimeEntry | null;
    recent_entries: TimeEntry[];
    summary: {
        from: string;
        to: string;
        total_minutes: number;
        total_hours: number;
    };
    absences: Absence[];
    calendar: {
        month: string;
        starts_on: string;
        ends_on: string;
        shifts: Shift[];
    };
    service_reports: {
        id: number;
        name: string;
        customer?: string | null;
        has_report: boolean;
        pdf_url: string | null;
    }[];
};

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('de-DE');
}

function formatMinutes(minutes: number | null) {
    if (minutes === null || minutes === undefined) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

async function getLocation(): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> {
    if (!navigator.geolocation) return null;
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 8000 },
        );
    });
}

export default function EmployeePortal({
    upcoming_shifts,
    today_shifts,
    open_entry,
    recent_entries,
    summary,
    absences,
    calendar,
    service_reports,
}: Props) {
    const [checking, setChecking] = useState(false);
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};

    const checkInForm = useForm({
        shift_id: '',
        latitude: null as number | null,
        longitude: null as number | null,
        accuracy: null as number | null,
    });

    const checkOutForm = useForm({
        break_minutes: 0,
        notes: '',
        latitude: null as number | null,
        longitude: null as number | null,
        accuracy: null as number | null,
    });

    const absenceForm = useForm({
        type: 'vacation',
        starts_on: '',
        ends_on: '',
        notes: '',
    });

    const handleCheckIn = async (shiftId: number) => {
        setChecking(true);
        const location = await getLocation();
        checkInForm.clearErrors();
        try {
            await postCheckIn({
                shift_id: shiftId,
                latitude: location?.latitude ?? null,
                longitude: location?.longitude ?? null,
                accuracy: location?.accuracy ?? null,
            });
            router.reload({ only: ['open_entry', 'recent_entries', 'summary', 'absences', 'upcoming_shifts', 'today_shifts'], preserveScroll: true });
        } catch (error: any) {
            if (error?.errors) {
                checkInForm.setError(error.errors);
            } else if (error?.message) {
                checkInForm.setError('shift_id', error.message);
            } else {
                checkInForm.setError('shift_id', 'Check-in fehlgeschlagen.');
            }
        } finally {
            setChecking(false);
        }
    };

    const handleCheckOut = async () => {
        if (!open_entry) return;
        setChecking(true);
        const location = await getLocation();
        checkOutForm.clearErrors();
        try {
            await postCheckOut(open_entry.id, {
                break_minutes: checkOutForm.data.break_minutes,
                notes: checkOutForm.data.notes,
                latitude: location?.latitude ?? null,
                longitude: location?.longitude ?? null,
                accuracy: location?.accuracy ?? null,
            });
            router.reload({ only: ['open_entry', 'recent_entries', 'summary', 'absences', 'upcoming_shifts', 'today_shifts'], preserveScroll: true });
        } catch (error: any) {
            if (error?.errors) {
                checkOutForm.setError(error.errors);
            } else if (error?.message) {
                checkOutForm.setError('time_entry', error.message);
            } else {
                checkOutForm.setError('time_entry', 'Check-out fehlgeschlagen.');
            }
        } finally {
            setChecking(false);
        }
    };

    const submitAbsence = (event: React.FormEvent) => {
        event.preventDefault();
        absenceForm.post(absencesRoute.store().url, { preserveScroll: true });
    };

    const monthLabel = () => {
        const [year, month] = calendar.month.split('-').map((part) => Number(part));
        if (!year || !month) return calendar.month;
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    };

    const prevMonth = () => {
        const [year, month] = calendar.month.split('-').map((part) => Number(part));
        const date = new Date(year, month - 2, 1);
        const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(employeeRoute.portal().url, { month: next }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const nextMonth = () => {
        const [year, month] = calendar.month.split('-').map((part) => Number(part));
        const date = new Date(year, month, 1);
        const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(employeeRoute.portal().url, { month: next }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const jumpTo = (value: string) => {
        if (!value) return;
        router.get(employeeRoute.portal().url, { month: value }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear + index);

    const calendarShiftsByDay = new Map<string, Shift[]>();
    calendar.shifts.forEach((shift) => {
        const date = new Date(shift.starts_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const existing = calendarShiftsByDay.get(key) ?? [];
        existing.push(shift);
        calendarShiftsByDay.set(key, existing);
    });

    const monthStart = new Date(`${calendar.month}-01T00:00:00`);
    const month = monthStart.getMonth();
    const year = monthStart.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (monthStart.getDay() + 6) % 7;
    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ date, day });
    }

    const statusTone = (status: string, isPast: boolean) => {
        if (isPast) {
            return 'bg-slate-100 text-slate-400 line-through';
        }
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 text-emerald-700';
            case 'cancelled':
                return 'bg-rose-100 text-rose-700';
            default:
                return 'bg-amber-100 text-amber-700';
        }
    };

    const agendaDays = Array.from(calendarShiftsByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, shifts]) => ({
            date,
            shifts: shifts.sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
        }));

    const todayStatusTone = (shift: Shift) => {
        if (shift.is_open) {
            return 'bg-emerald-100 text-emerald-700';
        }

        if (shift.checked_out_at) {
            return 'bg-slate-100 text-slate-500';
        }

        return 'bg-amber-100 text-amber-700';
    };

    const todayStatusLabel = (shift: Shift) => {
        if (shift.is_open) {
            return 'Läuft';
        }

        if (shift.checked_out_at) {
            return 'Erledigt';
        }

        if (shift.has_time_entry) {
            return 'Eingecheckt';
        }

        return 'Offen';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mein Bereich" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {(flash.success || flash.error) && (
                    <div className={`rounded-lg border px-4 py-3 text-sm ${
                        flash.success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}>
                        {flash.success ?? flash.error}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-semibold">Mein Bereich</h1>
                    <p className="text-sm text-muted-foreground">Schichten, Check-in/out und Abwesenheiten.</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase tracking-widest text-muted-foreground">Check-in</div>
                            <div className="mt-2 text-lg font-semibold">
                                {open_entry ? 'Schicht läuft' : 'Nächste Schicht'}
                            </div>
                        </div>
                    </div>

                    {checkInForm.errors.shift_id && (
                        <div className="mt-2 text-xs text-rose-600">{checkInForm.errors.shift_id}</div>
                    )}

                    {open_entry ? (
                        <div className="mt-4 rounded-lg border border-border/60 p-4">
                            <div className="font-semibold">{open_entry.shift?.title ?? 'Schicht'}</div>
                            <div className="text-xs text-muted-foreground">
                                Check-in: {formatDateTime(open_entry.check_in_at)}
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Pause (Min)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={600}
                                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={checkOutForm.data.break_minutes}
                                        onChange={(e) => checkOutForm.setData('break_minutes', Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground">Notiz</label>
                                    <input
                                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={checkOutForm.data.notes}
                                        onChange={(e) => checkOutForm.setData('notes', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckOut}
                                    disabled={checking}
                                    className="sm:col-span-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    Check-out
                                </button>
                                {checkOutForm.errors.time_entry && (
                                    <div className="sm:col-span-2 text-xs text-rose-600">{checkOutForm.errors.time_entry}</div>
                                )}
                            </div>
                        </div>
                    ) : upcoming_shifts.length > 0 ? (
                        <div className="mt-4 rounded-lg border border-border/60 p-4">
                            <div className="font-semibold">{upcoming_shifts[0].title ?? 'Schicht'}</div>
                            <div className="text-xs text-muted-foreground">
                                {formatDateTime(upcoming_shifts[0].starts_at)} – {formatDateTime(upcoming_shifts[0].ends_at)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {upcoming_shifts[0].site?.name ?? '—'}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleCheckIn(upcoming_shifts[0].id)}
                                disabled={checking}
                                className={`mt-3 rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                    checking ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600'
                                }`}
                            >
                                Check-in
                            </button>
                        </div>
                    ) : (
                        <div className="mt-4 text-sm text-muted-foreground">Keine Schichten geplant.</div>
                    )}

                    <div className="mt-6">
                        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Heute</div>
                        <div className="mt-3 space-y-2">
                            {today_shifts.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Heute sind keine Aufträge geplant.</div>
                            ) : (
                                today_shifts.map((shift) => {
                                    const canCheckIn = !open_entry && !shift.has_time_entry;

                                    return (
                                        <div key={shift.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold">{shift.title ?? 'Schicht'}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDateTime(shift.starts_at)} – {formatDateTime(shift.ends_at)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{shift.site?.name ?? '—'}</div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${todayStatusTone(shift)}`}>
                                                    {todayStatusLabel(shift)}
                                                </span>
                                                {canCheckIn && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheckIn(shift.id)}
                                                        disabled={checking}
                                                        className={`rounded-md px-3 py-2 text-xs font-semibold text-white ${
                                                            checking ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600'
                                                        }`}
                                                    >
                                                        Check-in
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold">Leistungsverzeichnisse</h2>
                            <p className="text-xs text-muted-foreground">Für deine Objekte verfügbare PDFs.</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {service_reports.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Objekte zugewiesen.</div>
                        ) : (
                            service_reports.map((site) => (
                                <div
                                    key={site.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                                >
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{site.name}</div>
                                        <div className="text-xs text-muted-foreground">{site.customer ?? '—'}</div>
                                    </div>
                                    {site.has_report && site.pdf_url ? (
                                        <a
                                            href={site.pdf_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground"
                                        >
                                            PDF öffnen
                                        </a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Kein PDF vorhanden</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">Kalender</h2>
                            <div className="text-xs text-muted-foreground">
                                {calendar.starts_on} – {calendar.ends_on}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="rounded-md border border-border px-3 py-1 text-xs"
                            >
                                ◀︎
                            </button>
                            <div className="text-sm font-semibold">{monthLabel()}</div>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="rounded-md border border-border px-3 py-1 text-xs"
                            >
                                ▶︎
                            </button>
                            <select
                                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                                value={calendar.month}
                                onChange={(e) => jumpTo(e.target.value)}
                            >
                                {yearOptions.map((yearOption) =>
                                    Array.from({ length: 12 }, (_, idx) => {
                                        const monthValue = `${yearOption}-${String(idx + 1).padStart(2, '0')}`;
                                        return (
                                            <option key={monthValue} value={monthValue}>
                                                {new Date(yearOption, idx, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                                            </option>
                                        );
                                    }),
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 hidden grid-cols-7 gap-2 text-xs text-muted-foreground md:grid">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label) => (
                            <div key={label} className="text-center font-semibold">
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="mt-2 hidden grid-cols-7 gap-2 md:grid">
                        {cells.map((cell, index) => {
                            if (!cell) {
                                return <div key={`empty-${index}`} className="min-h-[120px] rounded-lg border border-transparent" />;
                            }

                            const shiftsForDay = calendarShiftsByDay.get(cell.date) ?? [];

                            return (
                                <div key={cell.date} className="min-h-[120px] rounded-lg border border-border/60 p-2">
                                    <div className="text-xs font-semibold">{cell.day}</div>
                                    <div className="mt-2 grid gap-1">
                                        {shiftsForDay.length === 0 ? (
                                            <div className="text-[11px] text-muted-foreground">—</div>
                                        ) : (
                            shiftsForDay.map((shift) => {
                                const isPast = new Date(shift.ends_at).getTime() < Date.now();
                                return (
                                    <div
                                        key={shift.id}
                                        className={`rounded-md px-2 py-1 text-[11px] ${statusTone(shift.status, isPast)}`}
                                    >
                                        <div className="font-semibold">{shift.title ?? 'Schicht'}</div>
                                        <div className="text-[10px]">
                                            {formatDateTime(shift.starts_at)} – {formatDateTime(shift.ends_at)}
                                        </div>
                                        <div className="text-[10px]">{shift.site?.name ?? '—'}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            );
        })}
                    </div>

                    <div className="mt-4 grid gap-3 md:hidden">
                        {agendaDays.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Schichten in diesem Monat.</div>
                        ) : (
                            agendaDays.map(({ date, shifts }) => (
                                <div key={date} className="rounded-lg border border-border/60 p-3">
                                    <div className="text-xs font-semibold">
                                        {new Date(`${date}T00:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="mt-2 grid gap-2">
                                        {shifts.map((shift) => {
                                            const isPast = new Date(shift.ends_at).getTime() < Date.now();
                                            return (
                                                <div key={shift.id} className={`rounded-md px-2 py-2 text-xs ${statusTone(shift.status, isPast)}`}>
                                                <div className="font-semibold">{shift.title ?? 'Schicht'}</div>
                                                <div className="text-[11px]">
                                                    {formatDateTime(shift.starts_at)} – {formatDateTime(shift.ends_at)}
                                                </div>
                                                <div className="text-[11px]">{shift.site?.name ?? '—'}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">Abwesenheit beantragen</h2>
                            <p className="text-xs text-muted-foreground">Urlaub oder Krankheit direkt einreichen.</p>
                        </div>
                    </div>

                    <form onSubmit={submitAbsence} className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Typ</label>
                            <select
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={absenceForm.data.type}
                                onChange={(e) => absenceForm.setData('type', e.target.value)}
                            >
                                <option value="vacation">Urlaub</option>
                                <option value="sick">Krank</option>
                                <option value="other">Sonstiges</option>
                            </select>
                            {absenceForm.errors.type && (
                                <div className="mt-1 text-xs text-rose-600">{absenceForm.errors.type}</div>
                            )}
                        </div>
                        <div />
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Von</label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={absenceForm.data.starts_on}
                                onChange={(e) => absenceForm.setData('starts_on', e.target.value)}
                            />
                            {absenceForm.errors.starts_on && (
                                <div className="mt-1 text-xs text-rose-600">{absenceForm.errors.starts_on}</div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Bis</label>
                            <input
                                type="date"
                                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={absenceForm.data.ends_on}
                                onChange={(e) => absenceForm.setData('ends_on', e.target.value)}
                            />
                            {absenceForm.errors.ends_on && (
                                <div className="mt-1 text-xs text-rose-600">{absenceForm.errors.ends_on}</div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Notiz</label>
                            <textarea
                                className="mt-1 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={absenceForm.data.notes}
                                onChange={(e) => absenceForm.setData('notes', e.target.value)}
                            />
                            {absenceForm.errors.notes && (
                                <div className="mt-1 text-xs text-rose-600">{absenceForm.errors.notes}</div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={absenceForm.processing}
                                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                                    absenceForm.processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                {absenceForm.processing ? 'Sende…' : 'Abwesenheit beantragen'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <h3 className="text-sm font-semibold">Letzte Anträge</h3>
                        <div className="mt-3 space-y-2">
                            {absences.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Noch keine Abwesenheiten eingereicht.</div>
                            ) : (
                                absences.map((absence) => (
                                    <div
                                        key={absence.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">
                                                {absence.type === 'vacation'
                                                    ? 'Urlaub'
                                                    : absence.type === 'sick'
                                                      ? 'Krank'
                                                      : absence.type}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDate(absence.starts_on)} – {formatDate(absence.ends_on)}
                                            </div>
                                        </div>
                                        <div className="text-xs font-semibold text-muted-foreground">
                                            {absence.status}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
