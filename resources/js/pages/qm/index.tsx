import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'QM', href: '/qm/issues' },
];

type Issue = {
    id: number;
    status: string;
    message: string;
    created_at: string | null;
    site?: { id: number; name: string; customer?: string | null } | null;
};

type Props = {
    issues: {
        data: Issue[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

const statusLabels: Record<string, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    closed: 'Erledigt',
};

const statusTone = (status: string) => {
    switch (status) {
        case 'closed':
            return 'bg-emerald-100 text-emerald-700';
        case 'in_progress':
            return 'bg-amber-100 text-amber-700';
        default:
            return 'bg-rose-100 text-rose-700';
    }
};

export default function QmIndex({ issues }: Props) {
    const [closingId, setClosingId] = useState<number | null>(null);

    const quickClose = (id: number) => {
        setClosingId(id);
        router.patch(
            `/qm/issues/${id}`,
            { status: 'closed' },
            {
                preserveScroll: true,
                onFinish: () => setClosingId(null),
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QM" />
            <div className="flex flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">QM Reklamationen</h1>
                    <p className="text-sm text-muted-foreground">Eingehende Rückmeldungen je Objekt.</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">Objekt</th>
                                    <th className="px-3 py-2 text-left font-medium">Kunde</th>
                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                    <th className="px-3 py-2 text-left font-medium">Eingang</th>
                                    <th className="px-3 py-2 text-left font-medium">Aktion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {issues.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-muted-foreground">
                                            Keine Reklamationen vorhanden.
                                        </td>
                                    </tr>
                                ) : (
                                    issues.data.map((issue) => (
                                        <tr key={issue.id} className="border-t border-border/60">
                                            <td className="px-3 py-2">
                                                {issue.site?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                {issue.site?.customer ?? '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone(issue.status)}`}>
                                                    {statusLabels[issue.status] ?? issue.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                {issue.created_at
                                                    ? new Date(issue.created_at).toLocaleString('de-DE')
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={`/qm/issues/${issue.id}`}
                                                        className="text-xs font-semibold text-emerald-600"
                                                    >
                                                        Details
                                                    </Link>
                                                    {issue.status !== 'closed' && (
                                                        <button
                                                            type="button"
                                                            disabled={closingId === issue.id}
                                                            onClick={() => quickClose(issue.id)}
                                                            className="text-xs font-semibold text-slate-600"
                                                        >
                                                            {closingId === issue.id ? 'Schließe…' : 'Schließen'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
