<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\SiteIssue;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicQmController extends Controller
{
    public function show(string $token)
    {
        $site = Site::query()
            ->with('customer')
            ->where('qm_token', $token)
            ->firstOrFail();

        return Inertia::render('qm/public', [
            'site' => [
                'id' => $site->id,
                'name' => $site->name,
                'customer' => $site->customer?->name,
                'address' => trim(implode(' ', array_filter([
                    $site->address_line1,
                    $site->address_line2,
                    $site->postal_code,
                    $site->city,
                ]))) ?: null,
            ],
            'submit_url' => route('qm.public.store', $site->qm_token),
        ]);
    }

    public function store(Request $request, string $token)
    {
        $site = Site::query()
            ->where('qm_token', $token)
            ->firstOrFail();

        $payload = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'photos' => ['nullable', 'array', 'max:10'],
            'photos.*' => ['image', 'max:5120'],
        ]);

        $issue = SiteIssue::create([
            'tenant_id' => $site->tenant_id,
            'site_id' => $site->id,
            'status' => 'open',
            'message' => $payload['message'],
        ]);

        $files = $request->file('photos', []);
        foreach ($files as $file) {
            $path = $file->storeAs(
                'site-issues/'.$issue->id,
                Str::uuid().'.'.$file->getClientOriginalExtension(),
                'local'
            );

            $issue->files()->create([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        return redirect()
            ->to(route('qm.public.show', $site->qm_token))
            ->with('success', 'Reklamation wurde gesendet. Vielen Dank!');
    }
}
