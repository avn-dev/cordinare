<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryItemRequest;
use App\Http\Requests\UpdateInventoryItemRequest;
use App\Http\Resources\InventoryItemResource;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\Site;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', InventoryItem::class);

        $filters = [
            'site_id' => $request->integer('site_id') ?: null,
            'status' => $request->string('status')->toString(),
            'category' => $request->string('category')->toString(),
            'search' => $request->string('search')->toString(),
        ];

        $items = InventoryItem::query()
            ->with('site')
            ->when($filters['site_id'], fn ($query, $siteId) => $query->where('site_id', $siteId))
            ->when($filters['status'], fn ($query, $status) => $query->where('status', $status))
            ->when($filters['category'], fn ($query, $category) => $query->where('category', $category))
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', '%'.$search.'%')
                        ->orWhere('serial_number', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $sites = Site::query()->orderBy('name')->get(['id', 'name']);
        $categories = InventoryItem::query()
            ->whereNotNull('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        return Inertia::render('inventory/index', [
            'items' => InventoryItemResource::collection($items),
            'filters' => $filters,
            'sites' => $sites,
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        $this->authorize('create', InventoryItem::class);

        $sites = Site::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('inventory/create', [
            'sites' => $sites,
        ]);
    }

    public function store(StoreInventoryItemRequest $request)
    {
        $this->authorize('create', InventoryItem::class);

        $payload = $request->validated();

        $item = DB::transaction(function () use ($payload, $request) {
            $item = InventoryItem::create(array_merge($payload, [
                'created_by' => $request->user()?->id,
            ]));

            if (! empty($payload['site_id'])) {
                $this->recordMovement($item, null, (int) $payload['site_id'], 'Initiale Zuordnung');
            }

            return $item;
        });

        return redirect()->route('inventory.edit', $item);
    }

    public function edit(InventoryItem $inventory)
    {
        $this->authorize('update', $inventory);

        $inventory->load('site');
        $sites = Site::query()->orderBy('name')->get(['id', 'name']);
        $movements = InventoryMovement::query()
            ->where('inventory_item_id', $inventory->id)
            ->with(['fromSite', 'toSite', 'mover'])
            ->latest('moved_at')
            ->limit(20)
            ->get();

        return Inertia::render('inventory/edit', [
            'item' => [
                'id' => $inventory->id,
                'name' => $inventory->name,
                'category' => $inventory->category,
                'serial_number' => $inventory->serial_number,
                'status' => $inventory->status,
                'condition' => $inventory->condition,
                'quantity' => $inventory->quantity,
                'unit' => $inventory->unit,
                'last_seen_at' => $inventory->last_seen_at?->toIso8601String(),
                'notes' => $inventory->notes,
                'site_id' => $inventory->site_id,
            ],
            'sites' => $sites,
            'movements' => $movements->map(fn (InventoryMovement $movement) => [
                'id' => $movement->id,
                'from_site' => $movement->fromSite?->name,
                'to_site' => $movement->toSite?->name,
                'moved_by' => $movement->mover?->name,
                'moved_at' => $movement->moved_at?->toIso8601String(),
                'notes' => $movement->notes,
            ]),
        ]);
    }

    public function update(UpdateInventoryItemRequest $request, InventoryItem $inventory)
    {
        $this->authorize('update', $inventory);

        $payload = $request->validated();
        $previousSite = $inventory->site_id;
        $nextSite = $payload['site_id'] ?? null;

        DB::transaction(function () use ($inventory, $payload, $previousSite, $nextSite) {
            $inventory->update($payload);

            if ($previousSite !== $nextSite) {
                $this->recordMovement($inventory, $previousSite, $nextSite, 'Standortwechsel');
            }
        });

        return redirect()->route('inventory.edit', $inventory);
    }

    public function destroy(InventoryItem $inventory)
    {
        $this->authorize('delete', $inventory);

        $inventory->delete();

        return redirect()->route('inventory.index');
    }

    private function recordMovement(InventoryItem $item, ?int $fromSite, ?int $toSite, ?string $notes = null): void
    {
        InventoryMovement::create([
            'inventory_item_id' => $item->id,
            'from_site_id' => $fromSite,
            'to_site_id' => $toSite,
            'moved_by' => request()->user()?->id,
            'moved_at' => now(),
            'notes' => $notes,
        ]);
    }
}
