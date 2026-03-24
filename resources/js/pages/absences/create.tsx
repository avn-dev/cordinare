import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import absencesRoute from '@/routes/absences';

type UserOption = { id: number; name: string; email?: string | null };

type Props = {
    users: UserOption[];
    canAssignUser: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Abwesenheiten', href: absencesRoute.index().url },
    { title: 'Neu', href: absencesRoute.create().url },
];

const typeOptions = [
    { value: 'vacation', label: 'Urlaub' },
    { value: 'sick', label: 'Krankheit' },
    { value: 'special', label: 'Sonderurlaub' },
];

const statusOptions = [
    { value: 'pending', label: 'Ausstehend' },
    { value: 'approved', label: 'Genehmigt' },
    { value: 'rejected', label: 'Abgelehnt' },
];

export default function AbsenceCreate({ users, canAssignUser }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number } } };

    const { data, setData, post, processing, errors } = useForm({
        user_id: canAssignUser ? users[0]?.id ?? auth.user.id : auth.user.id,
        type: 'vacation',
        starts_on: '',
        ends_on: '',
        status: 'pending',
        notes: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(absencesRoute.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neue Abwesenheit" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Neue Abwesenheit</h1>
                    <p className="text-sm text-muted-foreground">Urlaub, Krankheit oder Sonderurlaub erfassen.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {canAssignUser && (
                        <div>
                            <label className="text-sm font-medium">Mitarbeiter</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.user_id}
                                onChange={(e) => setData('user_id', Number(e.target.value))}
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && <div className="mt-1 text-xs text-red-600">{errors.user_id}</div>}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium">Typ</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                        >
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && <div className="mt-1 text-xs text-red-600">{errors.type}</div>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Startdatum</label>
                        <input
                            type="date"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.starts_on}
                            onChange={(e) => setData('starts_on', e.target.value)}
                        />
                        {errors.starts_on && <div className="mt-1 text-xs text-red-600">{errors.starts_on}</div>}
                    </div>

                    <div>
                        <label className="text-sm font-medium">Enddatum</label>
                        <input
                            type="date"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.ends_on}
                            onChange={(e) => setData('ends_on', e.target.value)}
                        />
                        {errors.ends_on && <div className="mt-1 text-xs text-red-600">{errors.ends_on}</div>}
                    </div>

                    {canAssignUser && (
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <div className="mt-1 text-xs text-red-600">{errors.status}</div>}
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">Notiz</label>
                        <textarea
                            className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Optional: Hinweise zur Abwesenheit"
                        />
                        {errors.notes && <div className="mt-1 text-xs text-red-600">{errors.notes}</div>}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="submit"
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        disabled={processing}
                    >
                        Speichern
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
