import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import usersRoute from '@/routes/users';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
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

type RoleOption = { value: string; label: string };

type Props = {
    users: Paginated<User>;
    filters: {
        role: string;
        search: string;
    };
    roles: RoleOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mitarbeiter', href: usersRoute.index().url },
];

export default function UsersIndex({ users, filters, roles }: Props) {
    const { data, setData, get } = useForm({
        role: filters.role ?? '',
        search: filters.search ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        get(usersRoute.index().url, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mitarbeiter" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Mitarbeiter</h1>
                        <p className="text-sm text-muted-foreground">Benutzerverwaltung im Tenant.</p>
                    </div>
                    <Link
                        href={usersRoute.create().url}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        Neuer Mitarbeiter
                    </Link>
                </div>

                <form onSubmit={submit} className="rounded-xl border border-border/60 bg-background p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Rolle</label>
                            <select
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.role}
                                onChange={(e) => setData('role', e.target.value)}
                            >
                                <option value="">Alle</option>
                                {roles.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Suche</label>
                            <input
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                placeholder="Name oder Email"
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
                            href={usersRoute.index().url}
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
                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Rolle</th>
                                <th className="px-4 py-3 text-left font-medium">Erstellt</th>
                                <th className="px-4 py-3 text-left font-medium">Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                                        Keine Mitarbeiter vorhanden.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="border-t border-border/60">
                                        <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                        <td className="px-4 py-3 capitalize">{user.role?.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.created_at ? new Date(user.created_at).toLocaleString('de-DE') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={usersRoute.edit(user.id).url}
                                                className="text-sm font-semibold text-emerald-600"
                                            >
                                                Bearbeiten
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {users.meta.links.map((link) => (
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
