import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import usersRoute from '@/routes/users';

type RoleOption = { value: string; label: string };

type Props = {
    roles: RoleOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mitarbeiter', href: usersRoute.index().url },
    { title: 'Neu', href: usersRoute.create().url },
];

export default function UserCreate({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role: roles[0]?.value ?? 'employee',
        password: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(usersRoute.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Neuer Mitarbeiter" />
            <form onSubmit={submit} className="flex flex-col gap-6 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Neuer Mitarbeiter</h1>
                    <p className="text-sm text-muted-foreground">Benutzer anlegen und Rolle vergeben.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <input
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <div className="mt-1 text-xs text-red-600">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                            type="email"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <div className="mt-1 text-xs text-red-600">{errors.email}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Rolle</label>
                        <select
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                        >
                            {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        {errors.role && <div className="mt-1 text-xs text-red-600">{errors.role}</div>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Passwort</label>
                        <input
                            type="password"
                            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <div className="mt-1 text-xs text-red-600">{errors.password}</div>}
                    </div>
                </div>

                <div className="flex justify-end">
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
