import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Besichtigungen', href: '/inspections' },
    { title: 'Mein Kalender', href: '/inspections/calendar' },
];

type Appointment = {
    id: number;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    site?: { id: number; name: string } | null;
    customer?: { id: number; name: string } | null;
};

type Props = {
    month: string;
    appointments: Appointment[];
};

const statusTone = (status: string) => {
    switch (status) {
        case 'confirmed':
            return 'bg-emerald-100 text-emerald-700';
        case 'cancelled':
            return 'bg-rose-100 text-rose-700 line-through';
        default:
            return 'bg-amber-100 text-amber-700';
    }
};

export default function InspectionsCalendar({ month, appointments }: Props) {
    const monthStart = new Date(`${month}-01T00:00:00`);
    const year = monthStart.getFullYear();
    const monthIndex = monthStart.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = (monthStart.getDay() + 6) % 7;

    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cells.push({ date, day });
    }

    const appointmentsByDay = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
        if (!appointment.starts_at) return;
        const date = new Date(appointment.starts_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const existing = appointmentsByDay.get(key) ?? [];
        existing.push(appointment);
        appointmentsByDay.set(key, existing);
    });

    const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        const date = new Date(year, monthIndex - 1, 1);
        const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get('/inspections/calendar', { month: next }, { preserveScroll: true, preserveState: true, replace: true });
    };

    const nextMonth = () => {
        const date = new Date(year, monthIndex + 1, 1);
        const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get('/inspections/calendar', { month: next }, { preserveScroll: true, preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mein Besichtigungskalender" />
            <div className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Mein Besichtigungskalender</h1>
                        <p className="text-sm text-muted-foreground">Alle dir zugewiesenen Termine.</p>
                    </div>
                    <Link href="/inspections" className="rounded-md border border-border px-3 py-2 text-sm">
                        Zurück zur Liste
                    </Link>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{monthLabel}</div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={prevMonth} className="rounded-md border border-border px-3 py-1 text-xs">◀︎</button>
                            <button type="button" onClick={nextMonth} className="rounded-md border border-border px-3 py-1 text-xs">▶︎</button>
                        </div>
                    </div>

                    <div className="mt-4 hidden grid-cols-7 gap-2 text-xs text-muted-foreground md:grid">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label) => (
                            <div key={label} className="text-center font-semibold">{label}</div>
                        ))}
                    </div>

                    <div className="mt-2 hidden grid-cols-7 gap-2 md:grid">
                        {cells.map((cell, index) => {
                            if (!cell) {
                                return <div key={`empty-${index}`} className="min-h-[110px] rounded-lg border border-transparent" />;
                            }

                            const dayAppointments = appointmentsByDay.get(cell.date) ?? [];

                            return (
                                <div key={cell.date} className="min-h-[110px] rounded-lg border border-border/60 p-2">
                                    <div className="text-xs font-semibold">{cell.day}</div>
                                    <div className="mt-2 grid gap-1">
                                        {dayAppointments.length === 0 ? (
                                            <div className="text-[11px] text-muted-foreground">—</div>
                                        ) : (
                                            dayAppointments.map((appointment) => (
                                                <div
                                                    key={appointment.id}
                                                    className={`rounded-md px-2 py-1 text-[11px] ${statusTone(appointment.status)}`}
                                                >
                                                    <div className="font-semibold">{appointment.site?.name ?? 'Objekt'}</div>
                                                    <div className="text-[10px]">
                                                        {appointment.starts_at
                                                            ? new Date(appointment.starts_at).toLocaleTimeString('de-DE', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })
                                                            : '—'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 grid gap-3 md:hidden">
                        {appointments.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Keine Termine in diesem Monat.</div>
                        ) : (
                            appointments.map((appointment) => (
                                <div key={appointment.id} className="rounded-lg border border-border/60 p-3">
                                    <div className="text-xs font-semibold">
                                        {appointment.starts_at
                                            ? new Date(appointment.starts_at).toLocaleDateString('de-DE', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })
                                            : '—'}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold">{appointment.site?.name ?? 'Objekt'}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {appointment.starts_at
                                            ? new Date(appointment.starts_at).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : '—'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
