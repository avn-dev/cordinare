import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type IssueFile = {
    id: number;
    name: string | null;
    url: string;
    download_url?: string;
};

type Issue = {
    id: number;
    status: string;
    message: string;
    created_at: string | null;
    site?: { id: number; name: string; customer?: string | null } | null;
    files: IssueFile[];
};

type Props = {
    issue: Issue;
};

export default function QmShow({ issue }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const { data, setData, patch, processing } = useForm({
        status: issue.status,
    });
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'QM', href: '/qm/issues' },
        { title: `Reklamation #${issue.id}`, href: `/qm/issues/${issue.id}` },
    ];

    const openViewer = (index: number) => setViewerIndex(index);
    const closeViewer = () => setViewerIndex(null);
    const showPrev = () => {
        if (viewerIndex === null) return;
        setViewerIndex((viewerIndex + issue.files.length - 1) % issue.files.length);
    };
    const showNext = () => {
        if (viewerIndex === null) return;
        setViewerIndex((viewerIndex + 1) % issue.files.length);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`QM #${issue.id}`} />
            <div className="flex flex-col gap-6 rounded-xl p-4">
                {(flash.success || flash.error) && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            flash.success
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-rose-200 bg-rose-50 text-rose-800'
                        }`}
                    >
                        {flash.success ?? flash.error}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Reklamation #{issue.id}</h1>
                        <p className="text-sm text-muted-foreground">
                            {issue.site?.name ?? 'Objekt'} {issue.site?.customer ? `· ${issue.site.customer}` : ''}
                        </p>
                    </div>
                    <Link href="/qm/issues" className="text-sm font-semibold text-emerald-600">
                        Zurück
                    </Link>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Status: <span className="capitalize text-foreground">{issue.status}</span></span>
                        <span>·</span>
                        <span>
                            Eingang: {issue.created_at ? new Date(issue.created_at).toLocaleString('de-DE') : '—'}
                        </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <select
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="open">Offen</option>
                            <option value="in_progress">In Bearbeitung</option>
                            <option value="closed">Erledigt</option>
                        </select>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => patch(`/qm/issues/${issue.id}`)}
                            className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${
                                processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                        >
                            Status speichern
                        </button>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm text-foreground">{issue.message}</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-5">
                    <h2 className="text-sm font-semibold">Bilder</h2>
                    {issue.files.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">Keine Bilder hochgeladen.</p>
                    ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {issue.files.map((file) => (
                                <button
                                    type="button"
                                    key={file.id}
                                    onClick={() => openViewer(issue.files.findIndex((item) => item.id === file.id))}
                                    className="overflow-hidden rounded-lg border border-border/60"
                                >
                                    <img src={file.url} alt={file.name ?? `Bild ${file.id}`} className="h-48 w-full object-cover" />
                                    <div className="px-3 py-2 text-xs text-muted-foreground">
                                        {file.name ?? 'Bild'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viewerIndex !== null && issue.files[viewerIndex] && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
                    onClick={closeViewer}
                >
                    <div className="relative max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={issue.files[viewerIndex].url}
                            alt={issue.files[viewerIndex].name ?? `Bild ${issue.files[viewerIndex].id}`}
                            className="max-h-[80vh] w-auto rounded-lg object-contain"
                        />
                        <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                            <span>{issue.files[viewerIndex].name ?? 'Bild'}</span>
                            <span>
                                {viewerIndex + 1} / {issue.files.length}
                            </span>
                        </div>
                        {issue.files[viewerIndex].download_url && (
                            <a
                                href={issue.files[viewerIndex].download_url}
                                className="mt-3 inline-flex rounded-md bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900"
                                download
                            >
                                Download
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={closeViewer}
                            className="absolute -right-2 -top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900"
                        >
                            ✕
                        </button>
                        {issue.files.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={showPrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900"
                                >
                                    ◀︎
                                </button>
                                <button
                                    type="button"
                                    onClick={showNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900"
                                >
                                    ▶︎
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
