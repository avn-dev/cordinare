import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function buildExportUrl(
    baseUrl: NonNullable<InertiaLinkProps['href']>,
    params: Record<string, unknown>,
): string {
    const url = toUrl(baseUrl);
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (item !== '' && item !== null && item !== undefined) {
                    searchParams.append(key, String(item));
                }
            });
            return;
        }

        searchParams.set(key, String(value));
    });

    const query = searchParams.toString();
    return query ? `${url}?${query}` : url;
}
