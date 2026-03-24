import { Head, Link, useForm, router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import shiftTemplatesRoute from '@/routes/shift-templates';
import shiftsRoute from '@/routes/shifts';

type ShiftTemplate = {
    id: number;
    name: string;
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    schedule_blocks?: { day_of_week: number; starts_at: string; ends_at: string }[];
    status: string;
    active: boolean;
    site?: { id: number; name: string } | null;
    users: { id: number; name: string }[];
    created_at: string | null;
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
    templates: Paginated<ShiftTemplate>;
    filters: {
        site_id: number | null;
        day_of_week: number | null;
        active: string;
        search: string;
    };
    sites: { id: number; name: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Schichten', href: shiftsRoute.index().url },
    { title: 'Regelmäßige Schichten', href: shiftTemplatesRoute.index().url },
];

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const uniqueDays = (blocks?: { day_of_week: number }[]) => {
    if (!blocks || blocks.length === 0) {
        return [];
    }
    const days = Array.from(new Set(blocks.map((b) => b.day_of_week))).sort((a, b) => a - b);
    return days.map((day) => dayLabels[day] ?? '—');
};

const formatTimeSummary = (blocks?: { day_of_week: number; starts_at: string; ends_at: string }[]) => {
    if (!blocks || blocks.length === 0) {
        return '—';
    }
    const uniqueTimes = Array.from(
        new Set(blocks.map((b) => `${b.starts_at}–${b.ends_at}`)),
    );

    if (uniqueTimes.length === 1) {
        return uniqueTimes[0];
    }

    return blocks
        .map((block) => `${dayLabels[block.day_of_week] ?? '—'} ${block.starts_at}–${block.ends_at}`)
        .join(', ');
};

export default function ShiftTemplatesIndex({ templates, filters, sites }: Props) {
    const fallbackTemplates: Paginated<ShiftTemplate> = {
        data: [],
        links: { first: null, last: null, prev: null, next: null },
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0, links: [] },
    };

    const safeTemplates: Paginated<ShiftTemplate> = {
        data: templates?.data ?? fallbackTemplates.data,
        links: templates?.links ?? fallbackTemplates.links,
        meta: templates?.meta ?? fallbackTemplates.meta,
    };

    const safeFilters = filters ?? {
        site_id: null,
        day_of_week: null,
        active: '',
        search: '',
    };

    const safeSites = sites ?? [];

    const { data, setData, get } = useForm({
        site_id: safeFilters.site_id ?? '',
        day_of_week: safeFilters.day_of_week ?? '',
        active: safeFilters.active ?? '',
        search: safeFilters.search ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(shiftTemplatesRoute.index().url, { preserveState: true, replace: true });
    };

    const confirmDelete = (templateId: number) => {
        if (!window.confirm('Vorlage wirklich löschen? Bereits erzeugte Schichten bleiben bestehen.')) {
            return;
        }
        router.delete(shiftTemplatesRoute.destroy(templateId).url, { preserveScroll: true, replace: true });
    };

    const generate = () => {
        router.post(shiftTemplatesRoute.generate().url, { weeks: 4 }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Regelmäßige Schichten" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">Regelmäßige Schichten</h1>
                        <p className="text-sm text-muted-foreground">Schicht-Vorlagen zur automatischen Planung.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={generate}
                            className="rounded-md border border-border px-3 py-2 text-sm"
                        >
                            Nächste 4 Wochen erzeugen
                        </button>
                        <Link
                            href={shiftTemplatesRoute.create().url}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                            Neue Vorlage
                        </Link>
                    </div>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Objekt</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.site_id}
                                onChange={(e) => setData('site_id', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {safeSites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Wochentag</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.day_of_week}
                                onChange={(e) => setData('day_of_week', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {dayLabels.map((label, idx) => (
                                    <option key={label} value={idx}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Aktiv</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.active}
                                onChange={(e) => setData('active', e.target.value)}
                            >
                                <option value="">Alle</option>
                                <option value="1">Aktiv</option>
                                <option value="0">Inaktiv</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Suche</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder="Vorlage"
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
                        <Link
                            href={shiftTemplatesRoute.index().url}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            Zurücksetzen
                        </Link>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Vorlage</th>
                                <th className="px-4 py-3 text-left font-medium">Objekt</th>
                                <th className="px-4 py-3 text-left font-medium">Tag</th>
                                <th className="px-4 py-3 text-left font-medium">Zeit</th>
                                <th className="px-4 py-3 text-left font-medium">Mitarbeiter</th>
                                <th className="px-4 py-3 text-left font-medium">Aktiv</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeTemplates.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                                        Keine Vorlagen vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                safeTemplates.data.map((template) => (
                                    <tr key={template.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 font-medium text-foreground">{template.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{template.site?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {uniqueDays(template.schedule_blocks).join(', ') || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatTimeSummary(template.schedule_blocks)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {template.users.length > 0 ? template.users.map((u) => u.name).join(', ') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${template.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-600'}`}>
                                                {template.active ? 'Aktiv' : 'Inaktiv'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    href={shiftTemplatesRoute.edit(template.id).url}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    Bearbeiten
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDelete(template.id)}
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
                    {(safeTemplates.meta?.links ?? []).map((link) => (
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
