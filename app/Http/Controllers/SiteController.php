<?php

namespace App\Http\Controllers;

use App\Http\Resources\SiteResource;
use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Models\Customer;
use App\Models\Site;
use App\Models\SiteClosure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SiteController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Site::class);

        $filters = [
            'customer_id' => $request->integer('customer_id') ?: null,
            'status' => $request->string('status')->toString(),
            'search' => $request->string('search')->toString(),
            'sort' => $request->string('sort')->toString(),
        ];

        $sites = Site::query()
            ->with('customer')
            ->when($filters['customer_id'], fn ($query, $customerId) => $query->where('customer_id', $customerId))
            ->when($filters['status'], fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('address_line1', 'like', "%{$search}%");
                });
            })
            ->when($filters['sort'], function ($query, $sort) {
                match ($sort) {
                    'name' => $query->orderBy('name'),
                    'customer' => $query->orderBy('customer_id'),
                    'created_at' => $query->orderByDesc('created_at'),
                    default => $query->latest(),
                };
            }, fn ($query) => $query->latest())
            ->paginate(20)
            ->withQueryString();

        $customers = Customer::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('sites/index', [
            'sites' => SiteResource::collection($sites),
            'filters' => $filters,
            'customers' => $customers,
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Site::class);

        $customers = Customer::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('sites/create', [
            'customers' => $customers,
            'defaults' => [
                'customer_id' => $request->integer('customer_id') ?: null,
            ],
        ]);
    }

    public function store(StoreSiteRequest $request)
    {
        $this->authorize('create', Site::class);

        $payload = $request->validated();
        $closures = $payload['closures'] ?? [];
        unset($payload['closures']);

        $site = DB::transaction(function () use ($payload, $closures) {
            $site = Site::create($payload);
            $this->syncClosures($site, $closures);

            return $site;
        });

        return redirect()
            ->route('sites.edit', $site)
            ->with('success', 'Objekt angelegt.');
    }

    public function edit(Site $site)
    {
        $this->authorize('update', $site);

        $site->load(['customer', 'closures']);
        $customers = Customer::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('sites/edit', [
            'site' => SiteResource::make($site)->resolve(),
            'customers' => $customers,
        ]);
    }

    public function update(UpdateSiteRequest $request, Site $site)
    {
        $this->authorize('update', $site);

        $payload = $request->validated();
        $closures = $payload['closures'] ?? [];
        unset($payload['closures']);

        DB::transaction(function () use ($site, $payload, $closures) {
            $site->update($payload);
            $this->syncClosures($site, $closures);
        });

        return redirect()
            ->route('sites.edit', $site)
            ->with('success', 'Objekt aktualisiert.');
    }

    public function destroy(Site $site)
    {
        $this->authorize('delete', $site);

        $site->delete();

        return redirect()
            ->route('sites.index')
            ->with('success', 'Objekt gelöscht.');
    }

    private function syncClosures(Site $site, array $closures): void
    {
        $site->closures()->delete();

        $payload = [];
        foreach ($closures as $closure) {
            if (! isset($closure['day_of_week'], $closure['starts_at'], $closure['ends_at'])) {
                continue;
            }
            $payload[] = [
                'day_of_week' => (int) $closure['day_of_week'],
                'starts_at' => $closure['starts_at'],
                'ends_at' => $closure['ends_at'],
                'label' => $closure['label'] ?? null,
            ];
        }

        if ($payload !== []) {
            $site->closures()->createMany($payload);
        }
    }
}
