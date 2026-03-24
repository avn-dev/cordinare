import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Props = {
    appointment: {
        id: number;
        email_subject: string;
        email_body: string;
        site?: { id: number; name: string } | null;
        customer?: { id: number; name: string; email?: string | null } | null;
        starts_at?: string | null;
        ends_at?: string | null;
        notes?: string | null;
    };
    preview_url: string;
    send_url: string;
};

export default function InspectionsCompose({ appointment, preview_url, send_url }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const { data, setData, post, processing } = useForm({
        email_subject: appointment.email_subject,
        email_body: appointment.email_body,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Besichtigungen', href: '/inspections' },
        { title: `E-Mail #${appointment.id}`, href: `/inspections/${appointment.id}/compose` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="E-Mail bearbeiten" />
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

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">E-Mail bearbeiten</h1>
                        <p className="text-sm text-muted-foreground">
                            {appointment.site?.name ?? 'Objekt'} {appointment.customer?.name ? `· ${appointment.customer.name}` : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/inspections" className="rounded-md border border-border px-3 py-2 text-sm">
                            Zurück
                        </Link>
                        <a href={preview_url} target="_blank" className="rounded-md border border-border px-3 py-2 text-sm">
                            Vorschau
                        </a>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-4">
                        <div>
                            <label className="text-sm font-medium">Betreff</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.email_subject}
                                onChange={(e) => setData('email_subject', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Inhalt</label>
                            <textarea
                                className="mt-2 min-h-64 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.email_body}
                                onChange={(e) => setData('email_body', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/inspections"
                                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
                            >
                                Abbrechen
                            </Link>
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => post(send_url, { preserveScroll: true })}
                                className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                                    processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                {processing ? 'Sende…' : 'Bestätigung senden'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-4">
                    <h2 className="text-sm font-semibold">Vorschau (Text)</h2>
                    <div className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                        {data.email_body}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
