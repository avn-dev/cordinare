import { Head, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import shiftTemplatesRoute from '@/routes/shift-templates';

type Props = {
    template: {
        id: number;
        name: string;
        site_id: number;
        day_of_week: number;
        starts_at: string;
        ends_at: string;
        schedule_blocks: { day_of_week: number; starts_at: string; ends_at: string }[];
        status: string;
        active: boolean;
        notes: string | null;
        assigned_user_ids: number[];
    };
    sites: { id: number; name: string }[];
    users: { id: number; name: string; email: string; role: string | null }[];
};

const breadcrumbs = (template: Props['template']): BreadcrumbItem[] => [
    { title: 'Regelmäßige Schichten', href: shiftTemplatesRoute.index().url },
    { title: template.name, href: shiftTemplatesRoute.edit(template.id).url },
];

const dayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function ShiftTemplateEdit({ template, sites, users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: template.name,
        site_id: template.site_id,
        schedule_blocks: template.schedule_blocks?.length
            ? template.schedule_blocks
            : [{ day_of_week: template.day_of_week ?? 0, starts_at: template.starts_at ?? '08:00', ends_at: template.ends_at ?? '12:00' }],
        active: template.active,
        notes: template.notes ?? '',
        assigned_user_ids: template.assigned_user_ids ?? [],
        generate_weeks: 0,
    });

    const addBlock = () => {
        setData('schedule_blocks', [
            ...data.schedule_blocks,
            { day_of_week: 0, starts_at: '08:00', ends_at: '12:00' },
        ]);
    };

    const updateBlock = (
        index: number,
        key: 'day_of_week' | 'starts_at' | 'ends_at',
        value: number | string,
    ) => {
        const next = [...data.schedule_blocks];
        next[index] = { ...next[index], [key]: value };
        setData('schedule_blocks', next);
    };

    const removeBlock = (index: number) => {
        setData((prev) => {
            const remaining = prev.schedule_blocks.filter((_, idx) => idx !== index);
            return {
                ...prev,
                schedule_blocks:
                    remaining.length > 0
                        ? remaining
                        : [{ day_of_week: 0, starts_at: '08:00', ends_at: '12:00' }],
            };
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        put(shiftTemplatesRoute.update(template.id).url);
    };

    const confirmDelete = () => {
        if (!window.confirm('Vorlage wirklich löschen? Zukünftige, noch nicht bearbeitete Schichten aus dieser Vorlage werden ebenfalls entfernt.')) {
            return;
        }
        router.delete(shiftTemplatesRoute.destroy(template.id).url, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(template)}>
            <Head title="Schichtvorlage" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">{template.name}</h1>
                        <p className="text-sm text-muted-foreground">Regelmäßige Schicht bearbeiten.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                        >
                            Löschen
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Speichern
                        </button>
                    </div>
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
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Wochentage & Zeiten</label>
                            <button
                                type="button"
                                onClick={addBlock}
                                className="text-xs font-semibold text-emerald-600"
                            >
                                + Tag hinzufügen
                            </button>
                        </div>
                        <div className="mt-2 grid gap-2">
                            {data.schedule_blocks.map((block, index) => (
                                <div key={`${block.day_of_week}-${index}`} className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                                    <select
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={block.day_of_week}
                                        onChange={(e) => updateBlock(index, 'day_of_week', Number(e.target.value))}
                                    >
                                        {dayLabels.map((label, idx) => (
                                            <option key={label} value={idx}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="time"
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={block.starts_at}
                                        onChange={(e) => updateBlock(index, 'starts_at', e.target.value)}
                                    />
                                    <input
                                        type="time"
                                        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={block.ends_at}
                                        onChange={(e) => updateBlock(index, 'ends_at', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            removeBlock(index);
                                        }}
                                        className="rounded-md border border-border px-3 py-2 text-xs text-rose-600"
                                    >
                                        Entfernen
                                    </button>
                                </div>
                            ))}
                        </div>
                        {errors.schedule_blocks && (
                            <div className="mt-1 text-xs text-red-600">{errors.schedule_blocks}</div>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Aktiv</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.active ? '1' : '0'}
                            onChange={(e) => setData('active', e.target.value === '1')}
                        >
                            <option value="1">Aktiv</option>
                            <option value="0">Inaktiv</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Neue Schichten erzeugen (Wochen)</label>
                        <input
                            type="number"
                            min={0}
                            max={12}
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.generate_weeks}
                            onChange={(e) => setData('generate_weeks', Number(e.target.value))}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">0 = keine neuen Schichten.</p>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium">Mitarbeiter</label>
                    <div className="mt-2 grid gap-2 rounded-md border border-border bg-background p-2 text-xs sm:grid-cols-2">
                        {users.map((user) => (
                            <label key={user.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.assigned_user_ids.includes(user.id)}
                                    onChange={() =>
                                        setData(
                                            'assigned_user_ids',
                                            data.assigned_user_ids.includes(user.id)
                                                ? data.assigned_user_ids.filter((id) => id !== user.id)
                                                : [...data.assigned_user_ids, user.id],
                                        )
                                    }
                                />
                                <span>{user.name}</span>
                            </label>
                        ))}
                    </div>
                    {errors.assigned_user_ids && (
                        <div className="mt-1 text-xs text-red-600">{errors.assigned_user_ids}</div>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium">Notizen</label>
                    <textarea
                        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        rows={4}
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>
            </form>
        </AppLayout>
    );
}
