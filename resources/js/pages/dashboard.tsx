import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';
import leads from '@/routes/leads';
import offersRoute from '@/routes/offers';
import sitesRoute from '@/routes/sites';
import shiftsRoute from '@/routes/shifts';
import timeEntriesRoute from '@/routes/time-entries';
import absencesRoute from '@/routes/absences';
import { BadgeCheck, CalendarClock, ClipboardList, Mail, MapPin, Shield, Sparkles, Timer } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type Metric = {
    label: string;
    value: number;
    delta: string;
    tone: 'amber' | 'emerald' | 'sky' | 'rose';
};

type Lead = {
    id: number;
    name: string;
    created_at: string | null;
    status: string;
};

type Shift = {
    id: number;
    title: string | null;
    starts_at: string | null;
    ends_at: string | null;
};

type Issue = {
    id: number;
    message: string;
    created_at: string | null;
    site?: { id: number; name: string } | null;
};

type Props = {
    metrics: Metric[];
    alerts: { label: string; value: number }[];
    recent: {
        leads: { data: Lead[] };
        shifts: Shift[];
        issues: Issue[];
    };
};

const tones = {
    amber: 'bg-amber-500/15 text-amber-600',
    emerald: 'bg-emerald-500/15 text-emerald-600',
    sky: 'bg-sky-500/15 text-sky-600',
    rose: 'bg-rose-500/15 text-rose-600',
};

const highlights = [
    {
        title: 'Lead Inbox',
        description: 'Neue Kontaktanfragen prüfen und in Kunden konvertieren.',
        action: 'Leads öffnen',
        href: leads.index().url,
        icon: ClipboardList,
    },
    {
        title: 'Angebote',
        description: 'Angebote erstellen, versenden und PDFs exportieren.',
        action: 'Angebote öffnen',
        href: offersRoute.index().url,
        icon: BadgeCheck,
    },
    {
        title: 'Schichtplanung',
        description: 'Schichten planen, zuweisen und Zeitnachweise prüfen.',
        action: 'Schichtkalender',
        href: shiftsRoute.index().url,
        icon: CalendarClock,
    },
    {
        title: 'Zeiterfassung',
        description: 'Offene Check-outs und Anomalien im Blick behalten.',
        action: 'Zeiten prüfen',
        href: timeEntriesRoute.index().url,
        icon: Timer,
    },
    {
        title: 'Objekte',
        description: 'Standorte pro Kunde pflegen und sortieren.',
        action: 'Objekte öffnen',
        href: sitesRoute.index().url,
        icon: MapPin,
    },
    {
        title: 'Abwesenheiten',
        description: 'Urlaub & Krankheit prüfen und freigeben.',
        action: 'Abwesenheiten',
        href: absencesRoute.index().url,
        icon: Shield,
    },
];

export default function Dashboard({ metrics, alerts, recent }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { name?: string; tenant?: { name?: string } } } };
    const tenantName = auth?.user?.tenant?.name ?? 'dein Team';
    const userName = auth?.user?.name ?? 'Team';
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="relative flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-6">
                <div className="pointer-events-none absolute -right-40 -top-32 h-80 w-80 rounded-full bg-emerald-400/30 blur-[120px]" />
                <div className="pointer-events-none absolute -left-32 top-48 h-72 w-72 rounded-full bg-sky-400/30 blur-[120px]" />

                <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
                    <div className="absolute -right-20 -top-16 h-48 w-48 rounded-full bg-emerald-500/40 blur-[80px]" />
                    <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-amber-400/30 blur-[90px]" />
                    <div className="relative flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-emerald-200">
                            <Sparkles className="h-5 w-5" />
                            <span className="text-sm uppercase tracking-[0.2em]">Dashboard</span>
                        </div>
                        <div className="max-w-3xl">
                            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                                Willkommen zurück, {userName}.
                            </h1>
                            <p className="mt-4 text-base text-slate-200/90 md:text-lg">
                                {tenantName} im Blick: offene Aufgaben, KPIs und die nächsten Schichten.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={leads.index().url}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                            >
                                Inbox öffnen
                            </Link>
                            <Link
                                href="/docs/architecture.md"
                                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white/90 transition hover:-translate-y-0.5 hover:border-white/60"
                            >
                                Architektur lesen
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        {metric.label}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
                                </div>
                                <div className={`rounded-full p-2 ${tones[metric.tone]}`}>
                                    {metric.tone === 'amber' && <Mail className="h-4 w-4" />}
                                    {metric.tone === 'emerald' && <MapPin className="h-4 w-4" />}
                                    {metric.tone === 'sky' && <CalendarClock className="h-4 w-4" />}
                                    {metric.tone === 'rose' && <Timer className="h-4 w-4" />}
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">{metric.delta}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">Quick Wins</h2>
                        <p className="text-sm text-muted-foreground">
                            Die wichtigsten Workflows für dein Tagesgeschäft.
                        </p>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {highlights.map((item) => (
                                <div key={item.title} className="rounded-xl border border-border/60 p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <item.icon className="h-4 w-4 text-emerald-500" />
                                        {item.title}
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                                    <Link
                                        href={item.href}
                                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"
                                    >
                                        {item.action}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold">Alerts</h2>
                            <p className="text-sm text-muted-foreground">Aufgaben, die zeitnah geprüft werden müssen.</p>
                            <div className="mt-5 grid gap-3">
                                {alerts.map((alert) => (
                                    <div key={alert.label} className="rounded-xl border border-border/60 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground">{alert.label}</p>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                {alert.value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {alerts.length === 0 && (
                                    <div className="text-sm text-muted-foreground">Keine offenen Alerts.</div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/80 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold">Aktuell</h2>
                            <div className="mt-4 grid gap-4">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Letzte Leads</h3>
                                        <Link href={leads.index().url} className="text-xs font-semibold text-emerald-600">
                                            Alle Leads
                                        </Link>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        {recent.leads.data.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">Keine Leads.</div>
                                        ) : (
                                            recent.leads.data.map((lead) => (
                                                <div key={lead.id} className="rounded-xl border border-border/60 p-3">
                                                    <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {lead.created_at
                                                            ? new Date(lead.created_at).toLocaleString('de-DE')
                                                            : '—'}{' '}
                                                        · {lead.status}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Nächste Schichten</h3>
                                        <Link href={shiftsRoute.index().url} className="text-xs font-semibold text-emerald-600">
                                            Kalender
                                        </Link>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        {recent.shifts.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">Keine Schichten geplant.</div>
                                        ) : (
                                            recent.shifts.map((shift) => (
                                                <div key={shift.id} className="rounded-xl border border-border/60 p-3">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {shift.title ?? 'Schicht'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {shift.starts_at
                                                            ? new Date(shift.starts_at).toLocaleString('de-DE')
                                                            : '—'}{' '}
                                                        – {shift.ends_at ? new Date(shift.ends_at).toLocaleString('de-DE') : '—'}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Letzte Reklamationen</h3>
                                        <Link href="/qm/issues" className="text-xs font-semibold text-emerald-600">
                                            QM öffnen
                                        </Link>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        {recent.issues.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">Keine Reklamationen.</div>
                                        ) : (
                                            recent.issues.map((issue) => (
                                                <div key={issue.id} className="rounded-xl border border-border/60 p-3">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {issue.site?.name ?? 'Objekt'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {issue.created_at
                                                            ? new Date(issue.created_at).toLocaleString('de-DE')
                                                            : '—'}{' '}
                                                        · #{issue.id}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
