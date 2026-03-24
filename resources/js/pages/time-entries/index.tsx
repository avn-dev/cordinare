import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import timeEntriesRoute from '@/routes/time-entries';
import { buildExportUrl } from '@/lib/utils';
import shiftsRoute from '@/routes/shifts';

type TimeEntry = {
    id: number;
    shift_id: number;
    user_id: number;
    shift?: {
        id: number;
        title: string | null;
        site?: {
            id: number;
            name: string;
            latitude?: number | null;
            longitude?: number | null;
            address_line1?: string | null;
            address_line2?: string | null;
            postal_code?: string | null;
            city?: string | null;
            country?: string | null;
        } | null;
    } | null;
    user?: { id: number; name: string; email: string } | null;
    check_in_at: string | null;
    check_out_at: string | null;
    break_minutes: number;
    anomaly_flags?: string[] | null;
    gps?: {
        latitude?: number;
        longitude?: number;
        accuracy?: number;
        distance_m?: number;
        check_out?: { latitude?: number; longitude?: number; accuracy?: number };
    } | null;
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
    entries: Paginated<TimeEntry>;
    filters: {
        user_id: number | null;
        shift_id: number | null;
        from: string;
        to: string;
        flag: string;
    };
    users: { id: number; name: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Zeiterfassung', href: timeEntriesRoute.index().url },
];

const flagOptions = [
    { value: '', label: 'Alle' },
    { value: 'outside_geofence', label: 'Außerhalb Geofence' },
    { value: 'negative_break', label: 'Negative Pause' },
    { value: 'checkout_before_checkin', label: 'Checkout vor Check-in' },
];

export default function TimeEntriesIndex({ entries, filters, users }: Props) {
    const { data, setData, get } = useForm({
        user_id: filters.user_id ?? '',
        shift_id: filters.shift_id ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
        flag: filters.flag ?? '',
    });

    const [selected, setSelected] = useState<TimeEntry | null>(null);
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useEffect(() => {
        L.Icon.Default.mergeOptions({
            iconRetinaUrl,
            iconUrl,
            shadowUrl,
        });
    }, []);

    const exportUrl = () => buildExportUrl(timeEntriesRoute.export().url, data);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(timeEntriesRoute.index().url, { preserveState: true, replace: true });
    };

    const openMap = (entry: TimeEntry) => {
        setSelected(entry);
        dialogRef.current?.showModal();
    };

    const closeMap = () => {
        dialogRef.current?.close();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Zeiterfassung" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Zeiterfassung</h1>
                    <p className="text-sm text-muted-foreground">Check-in/out Einträge.</p>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-5">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Mitarbeiter</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Schicht</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.shift_id}
                                onChange={(e) => setData('shift_id', e.target.value)}
                                placeholder="Schicht-ID"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Flag</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.flag}
                                onChange={(e) => setData('flag', e.target.value)}
                            >
                                {flagOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
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
                            href={timeEntriesRoute.index().url}
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
                                <th className="px-4 py-3 text-left font-medium">Schicht</th>
                                <th className="px-4 py-3 text-left font-medium">Mitarbeiter</th>
                                <th className="px-4 py-3 text-left font-medium">Check-in</th>
                                <th className="px-4 py-3 text-left font-medium">Check-out</th>
                                <th className="px-4 py-3 text-left font-medium">Pause</th>
                                <th className="px-4 py-3 text-left font-medium">Flags</th>
                                <th className="px-4 py-3 text-left font-medium">Karte</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                                        Keine Einträge vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                entries.data.map((entry) => (
                                    <tr key={entry.id} className="border-t border-border/60">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={shiftsRoute.show(entry.shift_id).url}
                                                className="text-sm font-semibold text-emerald-600"
                                            >
                                                {entry.shift?.title ?? entry.shift?.site?.name ?? 'Schicht'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">{entry.user?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {entry.check_in_at ? new Date(entry.check_in_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {entry.check_out_at ? new Date(entry.check_out_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">{entry.break_minutes} min</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {entry.anomaly_flags?.length ? entry.anomaly_flags.join(', ') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => openMap(entry)}
                                                className="text-sm font-semibold text-emerald-600"
                                            >
                                                Karte
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {entries.meta.links.map((link) => (
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

            <dialog
                ref={dialogRef}
                className="w-[min(95vw,900px)] rounded-xl border border-border bg-background p-0 text-sm text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
            >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                        <h3 className="text-sm font-semibold">Check-in Standort</h3>
                        <p className="text-xs text-muted-foreground">
                            {selected?.user?.name ?? '—'} · {selected?.shift?.site?.name ?? 'Objekt'}
                        </p>
                    </div>
                    <button type="button" onClick={closeMap} className="text-sm">
                        Schließen
                    </button>
                </div>
                <div className="p-4">
                    {selected ? (
                        <EntryMap entry={selected} />
                    ) : (
                        <div className="text-sm text-muted-foreground">Kein Eintrag ausgewählt.</div>
                    )}
                </div>
            </dialog>
        </AppLayout>
    );
}

function EntryMap({ entry }: { entry: TimeEntry }) {
    const toNumber = (value: unknown) => {
        if (value === null || value === undefined) return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const siteLat = toNumber(entry.shift?.site?.latitude ?? null);
    const siteLng = toNumber(entry.shift?.site?.longitude ?? null);
    const checkInLat = toNumber(entry.gps?.latitude ?? null);
    const checkInLng = toNumber(entry.gps?.longitude ?? null);
    const checkOutLat = toNumber(entry.gps?.check_out?.latitude ?? null);
    const checkOutLng = toNumber(entry.gps?.check_out?.longitude ?? null);

    const [geocodedSite, setGeocodedSite] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);

    const buildAddress = () => {
        const site = entry.shift?.site;
        if (!site) return '';
        return [
            site.address_line1,
            site.address_line2,
            site.postal_code,
            site.city,
            site.country,
        ]
            .filter((part) => part && String(part).trim().length > 0)
            .join(', ');
    };

    const address = buildAddress();

    useEffect(() => {
        let mounted = true;
        const controller = new AbortController();

        const shouldGeocode =
            siteLat === null &&
            siteLng === null &&
            geocodedSite === null &&
            address.length > 0;

        if (!shouldGeocode) return () => controller.abort();

        const run = async () => {
            try {
                setGeoLoading(true);
                setGeoError(null);
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: { 'Accept-Language': 'de-DE' },
                });
                if (!response.ok) {
                    throw new Error('Geocoding fehlgeschlagen');
                }
                const payload = (await response.json()) as Array<{ lat: string; lon: string }>;
                if (!mounted) return;
                if (payload.length === 0) {
                    setGeoError('Keine Koordinaten gefunden.');
                    return;
                }
                const lat = Number(payload[0].lat);
                const lng = Number(payload[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    setGeocodedSite({ lat, lng });
                } else {
                    setGeoError('Koordinaten ungültig.');
                }
            } catch (error) {
                if (mounted && !(error instanceof DOMException && error.name === 'AbortError')) {
                    setGeoError('Geocoding nicht verfügbar.');
                }
            } finally {
                if (mounted) setGeoLoading(false);
            }
        };

        void run();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [address, geocodedSite, siteLat, siteLng]);

    const resolvedSiteLat = siteLat ?? geocodedSite?.lat ?? null;
    const resolvedSiteLng = siteLng ?? geocodedSite?.lng ?? null;

    const points: Array<[number, number]> = [];
    if (resolvedSiteLat !== null && resolvedSiteLng !== null) points.push([resolvedSiteLat, resolvedSiteLng]);
    if (checkInLat !== null && checkInLng !== null) points.push([checkInLat, checkInLng]);
    if (checkOutLat !== null && checkOutLng !== null) points.push([checkOutLat, checkOutLng]);

    const center: [number, number] = points[0] ?? [52.52, 13.405]; // fallback Berlin

    const distanceTo = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371e3;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const checkInDistance =
        resolvedSiteLat !== null && resolvedSiteLng !== null && checkInLat !== null && checkInLng !== null
            ? distanceTo(resolvedSiteLat, resolvedSiteLng, checkInLat, checkInLng)
            : null;

    const checkOutDistance =
        resolvedSiteLat !== null && resolvedSiteLng !== null && checkOutLat !== null && checkOutLng !== null
            ? distanceTo(resolvedSiteLat, resolvedSiteLng, checkOutLat, checkOutLng)
            : null;

    return (
        <div className="space-y-4">
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                    Objekt: {entry.shift?.site?.name ?? '—'}
                    {address.length > 0 && <div>Adresse: {address}</div>}
                    {geoLoading && <div>Adresse wird lokalisiert…</div>}
                    {geoError && <div>{geoError}</div>}
                    {checkInDistance !== null && (
                        <div>Check-in Distanz: {Math.round(checkInDistance)} m</div>
                    )}
                    {checkOutDistance !== null && (
                        <div>Check-out Distanz: {Math.round(checkOutDistance)} m</div>
                    )}
                </div>
                <div>
                    Check-in: {entry.check_in_at ? new Date(entry.check_in_at).toLocaleString('de-DE') : '—'}
                </div>
                <div>
                    Check-out: {entry.check_out_at ? new Date(entry.check_out_at).toLocaleString('de-DE') : '—'}
                </div>
            </div>

            <div className="h-[360px] w-full overflow-hidden rounded-lg border border-border/60">
                <MapContainer center={center} zoom={13} className="h-full w-full">
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {resolvedSiteLat !== null && resolvedSiteLng !== null && (
                        <CircleMarker
                            center={[resolvedSiteLat, resolvedSiteLng]}
                            radius={8}
                            pathOptions={{ color: '#0f172a', fillColor: '#0f172a', fillOpacity: 0.9 }}
                        >
                            <Popup>Objekt</Popup>
                        </CircleMarker>
                    )}
                    {checkInLat !== null && checkInLng !== null && (
                        <CircleMarker
                            center={[checkInLat, checkInLng]}
                            radius={9}
                            pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.9 }}
                        >
                            <Popup>Check-in</Popup>
                        </CircleMarker>
                    )}
                    {checkOutLat !== null && checkOutLng !== null && (
                        <CircleMarker
                            center={[checkOutLat, checkOutLng]}
                            radius={9}
                            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9 }}
                        >
                            <Popup>Check-out</Popup>
                        </CircleMarker>
                    )}
                    {points.length >= 2 && <Polyline positions={points} pathOptions={{ color: '#16a34a' }} />}
                </MapContainer>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-900" />
                    Objekt
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-600" />
                    Check-in
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-600" />
                    Check-out
                </span>
            </div>
        </div>
    );
}
