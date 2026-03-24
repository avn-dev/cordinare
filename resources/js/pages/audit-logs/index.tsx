import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import auditLogsRoute from '@/routes/audit-logs';
import offersRoute from '@/routes/offers';
import shiftsRoute from '@/routes/shifts';
import absencesRoute from '@/routes/absences';
import customersRoute from '@/routes/customers';
import sitesRoute from '@/routes/sites';
import leadsRoute from '@/routes/leads';
import timeEntriesRoute from '@/routes/time-entries';
import { buildExportUrl } from '@/lib/utils';

type Actor = { id: number; name: string; email?: string | null };

type AuditLog = {
    id: number;
    action: string;
    auditable_type: string;
    auditable_id: number;
    auditable_label?: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ip: string | null;
    user_agent: string | null;
    request_id: string | null;
    created_at: string;
    actor?: Actor | null;
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
    logs: Paginated<AuditLog>;
    filters: {
        action: string;
        auditable_type: string;
        actor_id: number | null;
        request_id: string;
        from: string;
        to: string;
    };
    actors: Actor[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit Logs', href: auditLogsRoute.index().url }];

const actionOptions = [
    { value: '', label: 'Alle' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
];

const typeOptions = [
    { value: '', label: 'Alle' },
    { value: 'App\\Models\\Offer', label: 'Offer' },
    { value: 'App\\Models\\Shift', label: 'Shift' },
    { value: 'App\\Models\\Assignment', label: 'Assignment' },
    { value: 'App\\Models\\TimeEntry', label: 'Time Entry' },
    { value: 'App\\Models\\Absence', label: 'Absence' },
];

const typeLabels: Record<string, string> = {
    'App\\Models\\Offer': 'Angebot',
    'App\\Models\\Shift': 'Schicht',
    'App\\Models\\Assignment': 'Zuweisung',
    'App\\Models\\TimeEntry': 'Zeiterfassung',
    'App\\Models\\Absence': 'Abwesenheit',
    'App\\Models\\Customer': 'Kunde',
    'App\\Models\\Site': 'Objekt',
    'App\\Models\\Lead': 'Lead',
};

const typeRoutes: Record<string, (id: number) => string | null> = {
    'App\\Models\\Offer': (id) => offersRoute.show(id).url,
    'App\\Models\\Shift': (id) => shiftsRoute.show(id).url,
    'App\\Models\\Assignment': (id) => shiftsRoute.index().url,
    'App\\Models\\TimeEntry': (id) => timeEntriesRoute.index().url,
    'App\\Models\\Absence': (id) => absencesRoute.edit(id).url,
    'App\\Models\\Customer': (id) => customersRoute.show(id).url,
    'App\\Models\\Site': (id) => sitesRoute.edit(id).url,
    'App\\Models\\Lead': (id) => leadsRoute.show(id).url,
};

export default function AuditLogsIndex({ logs, filters, actors }: Props) {
    const { data, setData, get } = useForm({
        action: filters.action ?? '',
        auditable_type: filters.auditable_type ?? '',
        actor_id: filters.actor_id ?? '',
        request_id: filters.request_id ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });

    const exportUrl = () => buildExportUrl(auditLogsRoute.export().url, data);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(auditLogsRoute.index().url, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Audit Logs</h1>
                    <p className="text-sm text-muted-foreground">Änderungen an kritischen Entitäten.</p>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-6">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Action</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.action}
                                onChange={(e) => setData('action', e.target.value)}
                            >
                                {actionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Entity</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.auditable_type}
                                onChange={(e) => setData('auditable_type', e.target.value)}
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Actor</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.actor_id}
                                onChange={(e) => setData('actor_id', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {actors.map((actor) => (
                                    <option key={actor.id} value={actor.id}>
                                        {actor.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Request ID</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.request_id}
                                onChange={(e) => setData('request_id', e.target.value)}
                                placeholder="req-..."
                            />
                        </div>
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
                        <Link
                            href={auditLogsRoute.index().url}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            Zurücksetzen
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.open(exportUrl(), '_blank', 'noopener,noreferrer')}
                            className="rounded-md border border-border px-4 py-2 text-sm"
                        >
                            CSV Export
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Zeit</th>
                                <th className="px-4 py-3 text-left font-medium">Action</th>
                                <th className="px-4 py-3 text-left font-medium">Entity</th>
                                <th className="px-4 py-3 text-left font-medium">Actor</th>
                                <th className="px-4 py-3 text-left font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                                        Keine Audit-Logs vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 text-muted-foreground">{log.created_at}</td>
                                        <td className="px-4 py-3 capitalize">{log.action}</td>
                                        <td className="px-4 py-3">
                                            {typeRoutes[log.auditable_type] ? (
                                                <Link
                                                    href={typeRoutes[log.auditable_type](log.auditable_id) ?? '#'}
                                                    className="text-sm font-semibold text-emerald-600"
                                                >
                                                    {log.auditable_label ?? typeLabels[log.auditable_type] ?? log.auditable_type}
                                                </Link>
                                            ) : (
                                                <span>{log.auditable_label ?? typeLabels[log.auditable_type] ?? log.auditable_type}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">{log.actor?.name ?? 'System'}</td>
                                        <td className="px-4 py-3">
                                            <details>
                                                <summary className="cursor-pointer text-sm text-emerald-600">
                                                    Anzeigen
                                                </summary>
                                                <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
                                                    <div>
                                                        <span className="font-semibold">Request</span>: {log.request_id ?? '—'}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">IP</span>: {log.ip ?? '—'}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Before</span>
                                                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(log.before, null, 2)}</pre>
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">After</span>
                                                        <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(log.after, null, 2)}</pre>
                                                    </div>
                                                </div>
                                            </details>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {logs.meta.links.map((link) => (
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
