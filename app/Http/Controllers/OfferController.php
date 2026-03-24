<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOfferRequest;
use App\Http\Requests\UpdateOfferRequest;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\SiteResource;
use App\Jobs\SendOfferJob;
use App\Models\Customer;
use App\Models\Offer;
use App\Models\Site;
use App\Support\Security\OfferNumber;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OfferController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Offer::class);

        $offers = Offer::query()
            ->with(['items', 'customer', 'site'])
            ->latest()
            ->paginate(20);

        return Inertia::render('offers/index', [
            'offers' => OfferResource::collection($offers),
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Offer::class);

        $customers = Customer::query()->orderBy('name')->get();
        $sites = Site::query()->orderBy('name')->get();

        return Inertia::render('offers/create', [
            'customers' => CustomerResource::collection($customers),
            'sites' => SiteResource::collection($sites),
            'number' => OfferNumber::generate(),
            'defaults' => [
                'customer_id' => $request->integer('customer_id') ?: null,
            ],
        ]);
    }

    public function store(StoreOfferRequest $request)
    {
        $this->authorize('create', Offer::class);

        $payload = $request->validated();
        $items = $payload['items'];
        unset($payload['items']);

        $offer = DB::transaction(function () use ($payload, $items) {
            if (empty($payload['number'])) {
                $payload['number'] = OfferNumber::generate();
            }

            if (! empty($payload['site_id'])) {
                $site = Site::query()->find($payload['site_id']);
                if (! $site || $site->customer_id !== $payload['customer_id']) {
                    abort(422, 'Objekt passt nicht zum Kunden.');
                }
            }

            $offer = Offer::create($payload);
            $offer->items()->createMany($items);

            return $offer;
        });

        return redirect()->route('offers.show', $offer);
    }

    public function show(Offer $offer)
    {
        $this->authorize('view', $offer);

        $offer->load(['items', 'customer', 'site']);

        return Inertia::render('offers/show', [
            'offer' => OfferResource::make($offer)->resolve(),
        ]);
    }

    public function edit(Offer $offer)
    {
        $this->authorize('update', $offer);

        $offer->load('items');

        $customers = Customer::query()->orderBy('name')->get();
        $sites = Site::query()->orderBy('name')->get();

        return Inertia::render('offers/edit', [
            'offer' => OfferResource::make($offer)->resolve(),
            'customers' => CustomerResource::collection($customers),
            'sites' => SiteResource::collection($sites),
        ]);
    }

    public function update(UpdateOfferRequest $request, Offer $offer)
    {
        $this->authorize('update', $offer);

        $payload = $request->validated();
        $items = $payload['items'] ?? null;
        unset($payload['items']);

        DB::transaction(function () use ($offer, $payload, $items) {
            if (! empty($payload['site_id'])) {
                $site = Site::query()->find($payload['site_id']);
                $customerId = $payload['customer_id'] ?? $offer->customer_id;
                if (! $site || $site->customer_id !== $customerId) {
                    abort(422, 'Objekt passt nicht zum Kunden.');
                }
            }

            $offer->update($payload);

            if ($items !== null) {
                $offer->items()->delete();
                $offer->items()->createMany($items);
            }
        });

        return redirect()->route('offers.show', $offer);
    }

    public function destroy(Offer $offer)
    {
        $this->authorize('delete', $offer);

        $offer->delete();

        return redirect()->route('offers.index');
    }

    public function send(Offer $offer)
    {
        $this->authorize('update', $offer);

        SendOfferJob::dispatch($offer->id);

        return redirect()
            ->back()
            ->with('success', 'Angebot wird versendet.');
    }

    public function pdf(Offer $offer)
    {
        $this->authorize('view', $offer);

        $offer->load(['items', 'customer', 'site']);

        if (! $offer->pdf_path || ! Storage::disk('local')->exists($offer->pdf_path)) {
            $filename = $offer->number ? $offer->number : 'offer-'.$offer->id;
            $path = 'offers/'.$offer->id.'/'.$filename.'-preview-v'.$offer->version.'.pdf';

            $pdf = Pdf::loadView('pdf.offer', ['offer' => $offer]);
            Storage::disk('local')->put($path, $pdf->output());

            $offer->pdf_path = $path;
            $offer->save();
        }

        return Storage::disk('local')->download($offer->pdf_path);
    }
}
