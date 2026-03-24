<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\OfferResource;
use App\Jobs\SendOfferJob;
use App\Models\Offer;
use App\Models\Site;
use App\Support\Security\OfferNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfferController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Offer::class);

        $offers = Offer::query()
            ->with(['items', 'customer', 'site'])
            ->latest()
            ->paginate(20);

        return OfferResource::collection($offers);
    }

    public function store(StoreOfferRequest $request)
    {
        $this->authorize('create', Offer::class);

        $payload = $request->validated();
        $items = $payload['items'];
        unset($payload['items']);

        return DB::transaction(function () use ($payload, $items) {
            if (empty($payload['number'])) {
                $payload['number'] = OfferNumber::generate();
            }

            if (! empty($payload['site_id'])) {
                $site = Site::query()->find($payload['site_id']);
                if (! $site || $site->customer_id !== $payload['customer_id']) {
                    throw ValidationException::withMessages([
                        'site_id' => ['Objekt passt nicht zum Kunden.'],
                    ]);
                }
            }

            $offer = Offer::create($payload);
            $offer->items()->createMany($items);

            $offer->load('items');

            return (new OfferResource($offer))
                ->response()
                ->setStatusCode(201);
        });
    }

    public function show(Offer $offer): OfferResource
    {
        $this->authorize('view', $offer);

        $offer->load('items');

        return new OfferResource($offer);
    }

    public function update(UpdateOfferRequest $request, Offer $offer): OfferResource
    {
        $this->authorize('update', $offer);

        $payload = $request->validated();

        $items = $payload['items'] ?? null;
        unset($payload['items']);

        return DB::transaction(function () use ($offer, $payload, $items) {
            if (! empty($payload['site_id'])) {
                $site = Site::query()->find($payload['site_id']);
                $customerId = $payload['customer_id'] ?? $offer->customer_id;
                if (! $site || $site->customer_id !== $customerId) {
                    throw ValidationException::withMessages([
                        'site_id' => ['Objekt passt nicht zum Kunden.'],
                    ]);
                }
            }

            $offer->update($payload);

            if ($items !== null) {
                $offer->items()->delete();
                $offer->items()->createMany($items);
            }

            $offer->load('items');

            return new OfferResource($offer);
        });
    }

    public function destroy(Offer $offer)
    {
        $this->authorize('delete', $offer);

        $offer->delete();

        return response()->noContent();
    }

    public function send(Offer $offer)
    {
        $this->authorize('update', $offer);

        SendOfferJob::dispatch($offer->id);

        return response()->json(['message' => 'Offer sending queued.']);
    }
}
