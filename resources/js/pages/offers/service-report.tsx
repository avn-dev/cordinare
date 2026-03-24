import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import offersRoute from '@/routes/offers';

type Days = {
    mo: boolean;
    di: boolean;
    mi: boolean;
    do: boolean;
    fr: boolean;
    sa: boolean;
    so: boolean;
};

type PlanRow = {
    area: string;
    room: string;
    flooring: string;
    size_m2: string;
    frequency: string;
    days: Days;
    week: string;
};

type Task = {
    label: string;
    frequency: string;
    days: Days;
    week: string;
};

type Section = {
    title: string;
    tasks: Task[];
};

type ReportPayload = {
    title: string;
    schedule_note: string;
    plan_rows: PlanRow[];
    sections: Section[];
};

type Offer = {
    id: number;
    number: string | null;
    customer?: { id: number; name: string } | null;
    site?: { id: number; name: string } | null;
};

type Props = {
    offer: Offer | { data: Offer };
    report: ReportPayload;
};

const breadcrumbs = (offer: Offer): BreadcrumbItem[] => [
    { title: 'Angebote', href: offersRoute.index().url },
    { title: offer.number ?? 'Angebot', href: offersRoute.show(offer.id).url },
    { title: 'Leistungsverzeichnis', href: `/offers/${offer.id}/service-report` },
];

const emptyDays = (): Days => ({
    mo: false,
    di: false,
    mi: false,
    do: false,
    fr: false,
    sa: false,
    so: false,
});

const emptyPlanRow = (): PlanRow => ({
    area: '',
    room: '',
    flooring: '',
    size_m2: '',
    frequency: '',
    days: emptyDays(),
    week: '',
});

const emptyTask = (): Task => ({
    label: '',
    frequency: '',
    days: emptyDays(),
    week: '',
});

const frequencyOptions = ['nach Bedarf', 'täglich', 'wöchentlich', 'monatlich', 'jährlich'] as const;
type FrequencyOption = (typeof frequencyOptions)[number];

const parseFrequency = (frequency: string): { cadence: FrequencyOption; count: string } => {
    const raw = frequency.trim();
    if (!raw) {
        return { cadence: 'nach Bedarf', count: '' };
    }

    const normalized = raw.toLowerCase();
    if (normalized.includes('bedarf')) {
        return { cadence: 'nach Bedarf', count: '' };
    }

    const countMatch = raw.match(/(\d+)/);
    const count = countMatch ? countMatch[1] : '1';

    if (normalized.includes('täglich') || normalized.includes('taeglich')) {
        return { cadence: 'täglich', count };
    }
    if (normalized.includes('wöchentlich') || normalized.includes('woechentlich')) {
        return { cadence: 'wöchentlich', count };
    }
    if (normalized.includes('monatlich')) {
        return { cadence: 'monatlich', count };
    }
    if (normalized.includes('jährlich') || normalized.includes('jaehrlich')) {
        return { cadence: 'jährlich', count };
    }

    return { cadence: 'wöchentlich', count };
};

const formatFrequency = (cadence: FrequencyOption, count: string): string => {
    if (cadence === 'nach Bedarf') {
        return 'nach Bedarf';
    }
    const normalizedCount = count.trim() || '1';
    return `${normalizedCount} x ${cadence}`;
};

export default function OfferServiceReport({ offer, report }: Props) {
    const normalized = 'data' in offer ? offer.data : offer;
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const { data, setData, put, processing, errors } = useForm({
        payload: report,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/offers/${normalized.id}/service-report`);
    };

    const updatePayload = (next: ReportPayload) => setData('payload', next);

    const updatePlanRow = (index: number, key: keyof PlanRow, value: string | Days) => {
        const next = structuredClone(data.payload);
        // @ts-expect-error dynamic update
        next.plan_rows[index][key] = value;
        updatePayload(next);
    };

    const updatePlanFrequency = (index: number, cadence: FrequencyOption, count: string) => {
        const next = structuredClone(data.payload);
        next.plan_rows[index].frequency = formatFrequency(cadence, count);
        updatePayload(next);
    };

    const togglePlanDay = (index: number, day: keyof Days) => {
        const next = structuredClone(data.payload);
        next.plan_rows[index].days[day] = !next.plan_rows[index].days[day];
        updatePayload(next);
    };

    const addPlanRow = () => {
        const next = structuredClone(data.payload);
        next.plan_rows.push(emptyPlanRow());
        updatePayload(next);
    };

    const removePlanRow = (index: number) => {
        const next = structuredClone(data.payload);
        next.plan_rows.splice(index, 1);
        updatePayload(next);
    };

    const updateSection = (sectionIndex: number, key: keyof Section, value: string) => {
        const next = structuredClone(data.payload);
        // @ts-expect-error dynamic update
        next.sections[sectionIndex][key] = value;
        updatePayload(next);
    };

    const updateTask = (sectionIndex: number, taskIndex: number, key: keyof Task, value: string | Days) => {
        const next = structuredClone(data.payload);
        // @ts-expect-error dynamic update
        next.sections[sectionIndex].tasks[taskIndex][key] = value;
        updatePayload(next);
    };

    const updateTaskFrequency = (sectionIndex: number, taskIndex: number, cadence: FrequencyOption, count: string) => {
        const next = structuredClone(data.payload);
        next.sections[sectionIndex].tasks[taskIndex].frequency = formatFrequency(cadence, count);
        updatePayload(next);
    };

    const toggleTaskDay = (sectionIndex: number, taskIndex: number, day: keyof Days) => {
        const next = structuredClone(data.payload);
        next.sections[sectionIndex].tasks[taskIndex].days[day] =
            !next.sections[sectionIndex].tasks[taskIndex].days[day];
        updatePayload(next);
    };

    const addTask = (sectionIndex: number) => {
        const next = structuredClone(data.payload);
        next.sections[sectionIndex].tasks.push(emptyTask());
        updatePayload(next);
    };

    const removeTask = (sectionIndex: number, taskIndex: number) => {
        const next = structuredClone(data.payload);
        next.sections[sectionIndex].tasks.splice(taskIndex, 1);
        updatePayload(next);
    };

    const addSection = () => {
        const next = structuredClone(data.payload);
        next.sections.push({ title: 'Neuer Bereich', tasks: [emptyTask()] });
        updatePayload(next);
    };

    const removeSection = (sectionIndex: number) => {
        const next = structuredClone(data.payload);
        next.sections.splice(sectionIndex, 1);
        updatePayload(next);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(normalized)}>
            <Head title="Leistungsverzeichnis" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Leistungsverzeichnis</h1>
                        <p className="text-sm text-muted-foreground">
                            Kunde: {normalized.customer?.name ?? '—'}
                            {normalized.site?.name ? ` · Objekt: ${normalized.site.name}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={offersRoute.show(normalized.id).url}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Zurück
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.open(`/offers/${normalized.id}/service-report/pdf`, '_blank', 'noopener,noreferrer')}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            PDF
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`rounded-md px-3 py-2 text-sm font-semibold text-primary-foreground ${
                                processing ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary'
                            }`}
                        >
                            {processing ? 'Speichere…' : 'Speichern'}
                        </button>
                    </div>
                </div>

                {flash.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        {flash.error}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium">Titel</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.payload.title}
                            onChange={(e) => updatePayload({ ...data.payload, title: e.target.value })}
                        />
                        {errors['payload.title'] && (
                            <div className="mt-1 text-xs text-red-600">{errors['payload.title']}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Hinweis</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.payload.schedule_note}
                            onChange={(e) => updatePayload({ ...data.payload, schedule_note: e.target.value })}
                        />
                        {errors['payload.schedule_note'] && (
                            <div className="mt-1 text-xs text-red-600">{errors['payload.schedule_note']}</div>
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Reinigungsplan</h2>
                        <button
                            type="button"
                            onClick={addPlanRow}
                            className="rounded-md border border-border px-2 py-1 text-xs"
                        >
                            Zeile hinzufügen
                        </button>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Raum-Nr.</th>
                                    <th className="px-3 py-2 text-left font-medium">Bezeichnung</th>
                                    <th className="px-3 py-2 text-left font-medium">Bodenbelag</th>
                                    <th className="px-3 py-2 text-left font-medium">Fläche m²</th>
                                    <th className="px-3 py-2 text-left font-medium">Häufigkeit</th>
                                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                                        <th key={day} className="px-2 py-2 text-center text-xs font-medium">
                                            {day}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-left font-medium">Woche</th>
                                    <th className="px-3 py-2 text-left font-medium">Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.payload.plan_rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-3 py-4 text-center text-sm text-muted-foreground">
                                            Noch keine Räume erfasst.
                                        </td>
                                    </tr>
                                ) : (
                                    data.payload.plan_rows.map((row, index) => (
                                        <tr key={`plan-${index}`} className="border-t border-border/60">
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={row.area}
                                                    onChange={(e) => updatePlanRow(index, 'area', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={row.room}
                                                    onChange={(e) => updatePlanRow(index, 'room', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={row.flooring}
                                                    onChange={(e) => updatePlanRow(index, 'flooring', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={row.size_m2}
                                                    onChange={(e) => updatePlanRow(index, 'size_m2', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                {(() => {
                                                    const parsed = parseFrequency(row.frequency);
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                                inputMode="numeric"
                                                                value={parsed.count}
                                                                disabled={parsed.cadence === 'nach Bedarf'}
                                                                onChange={(e) =>
                                                                    updatePlanFrequency(index, parsed.cadence, e.target.value)
                                                                }
                                                            />
                                                            <select
                                                                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                                value={parsed.cadence}
                                                                onChange={(e) =>
                                                                    updatePlanFrequency(
                                                                        index,
                                                                        e.target.value as FrequencyOption,
                                                                        parsed.count
                                                                    )
                                                                }
                                                            >
                                                                {frequencyOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            {(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as (keyof Days)[]).map((day) => (
                                                <td key={day} className="px-2 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.days[day]}
                                                        onChange={() => togglePlanDay(index, day)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={row.week}
                                                    onChange={(e) => updatePlanRow(index, 'week', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removePlanRow(index)}
                                                    className="text-xs text-rose-600"
                                                >
                                                    Entfernen
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Leistungsbereiche</h2>
                    <button
                        type="button"
                        onClick={addSection}
                        className="rounded-md border border-border px-2 py-1 text-xs"
                    >
                        Bereich hinzufügen
                    </button>
                </div>

                {data.payload.sections.map((section, sectionIndex) => (
                    <div key={`section-${sectionIndex}`} className="rounded-xl border border-border/60 bg-background p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <input
                                className="w-full max-w-xl rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold"
                                value={section.title}
                                onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => addTask(sectionIndex)}
                                    className="rounded-md border border-border px-2 py-1 text-xs"
                                >
                                    Tätigkeit hinzufügen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeSection(sectionIndex)}
                                    className="text-xs text-rose-600"
                                >
                                    Bereich entfernen
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">Tätigkeit</th>
                                        <th className="px-3 py-2 text-left font-medium">Häufigkeit</th>
                                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                                            <th key={day} className="px-2 py-2 text-center text-xs font-medium">
                                                {day}
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-left font-medium">Woche</th>
                                        <th className="px-3 py-2 text-left font-medium">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.tasks.map((task, taskIndex) => (
                                        <tr key={`task-${sectionIndex}-${taskIndex}`} className="border-t border-border/60">
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={task.label}
                                                    onChange={(e) => updateTask(sectionIndex, taskIndex, 'label', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                {(() => {
                                                    const parsed = parseFrequency(task.frequency);
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                                inputMode="numeric"
                                                                value={parsed.count}
                                                                disabled={parsed.cadence === 'nach Bedarf'}
                                                                onChange={(e) =>
                                                                    updateTaskFrequency(
                                                                        sectionIndex,
                                                                        taskIndex,
                                                                        parsed.cadence,
                                                                        e.target.value
                                                                    )
                                                                }
                                                            />
                                                            <select
                                                                className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                                value={parsed.cadence}
                                                                onChange={(e) =>
                                                                    updateTaskFrequency(
                                                                        sectionIndex,
                                                                        taskIndex,
                                                                        e.target.value as FrequencyOption,
                                                                        parsed.count
                                                                    )
                                                                }
                                                            >
                                                                {frequencyOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            {(['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as (keyof Days)[]).map((day) => (
                                                <td key={day} className="px-2 py-2 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.days[day]}
                                                        onChange={() => toggleTaskDay(sectionIndex, taskIndex, day)}
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-3 py-2">
                                                <input
                                                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                                                    value={task.week}
                                                    onChange={(e) => updateTask(sectionIndex, taskIndex, 'week', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeTask(sectionIndex, taskIndex)}
                                                    className="text-xs text-rose-600"
                                                >
                                                    Entfernen
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </form>
        </AppLayout>
    );
}
