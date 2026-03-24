import employeeRoute from '@/routes/employee';

type LocationPayload = {
    latitude: number | null;
    longitude: number | null;
    accuracy?: number | null;
};

type CheckInPayload = LocationPayload & { shift_id: number };

type CheckOutPayload = LocationPayload & { break_minutes: number; notes?: string };

function csrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    return meta?.content ?? '';
}

export async function postCheckIn(payload: CheckInPayload) {
    const response = await fetch(employeeRoute.checkIn().url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw data ?? { message: 'Check-in fehlgeschlagen.' };
    }

    return response.json().catch(() => null);
}

export async function postCheckOut(timeEntryId: number, payload: CheckOutPayload) {
    const response = await fetch(employeeRoute.checkOut(timeEntryId).url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw data ?? { message: 'Check-out fehlgeschlagen.' };
    }

    return response.json().catch(() => null);
}
