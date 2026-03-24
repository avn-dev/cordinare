import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';

type Props = {
    site: {
        id: number;
        name: string;
        customer?: string | null;
        address?: string | null;
    };
    submit_url: string;
};

export default function PublicQm({ site, submit_url }: Props) {
    const flash = (usePage().props as { flash?: { success?: string; error?: string } }).flash ?? {};
    const { data, setData, post, processing, errors } = useForm({
        message: '',
        photos: [] as File[],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        post(submit_url, { forceFormData: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
            <Head title="QM Reklamation" />
            <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-xs uppercase tracking-widest text-slate-400">QM</div>
                    <h1 className="mt-2 text-2xl font-semibold">Reklamation melden</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Objekt: <span className="font-semibold text-slate-700">{site.name}</span>
                        {site.customer ? ` · ${site.customer}` : ''}
                    </p>
                    {site.address && <p className="text-sm text-slate-500">{site.address}</p>}

                    {(flash.success || flash.error) && (
                        <div
                            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                                flash.success
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-rose-200 bg-rose-50 text-rose-800'
                            }`}
                        >
                            {flash.success ?? flash.error}
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Reklamation</label>
                            <textarea
                                className="mt-2 min-h-40 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                placeholder="Bitte beschreiben Sie das Problem so genau wie möglich."
                            />
                            {errors.message && <div className="mt-1 text-xs text-rose-600">{errors.message}</div>}
                        </div>

                        <div>
                            <label className="text-sm font-medium">Bilder (optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                                onChange={(e) => setData('photos', Array.from(e.target.files ?? []))}
                            />
                            {errors.photos && <div className="mt-1 text-xs text-rose-600">{errors.photos}</div>}
                            {errors['photos.0'] && (
                                <div className="mt-1 text-xs text-rose-600">{errors['photos.0']}</div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                                processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                        >
                            {processing ? 'Senden…' : 'Reklamation senden'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
