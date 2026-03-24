<?php

namespace App\Http\Controllers;

use App\Http\Resources\CustomerResource;
use App\Http\Resources\OfferResource;
use App\Http\Resources\SiteResource;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\Offer;
use App\Models\Site;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Customer::class);

        $filters = [
            'status' => $request->string('status')->toString(),
            'search' => $request->string('search')->toString(),
        ];

        $customers = Customer::query()
            ->when($filters['status'], fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => CustomerResource::collection($customers),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Customer::class);

        return Inertia::render('customers/create');
    }

    public function store(StoreCustomerRequest $request)
    {
        $this->authorize('create', Customer::class);

        $customer = Customer::create($request->validated());

        return redirect()
            ->route('customers.edit', $customer)
            ->with('success', 'Kunde angelegt.');
    }

    public function edit(Customer $customer)
    {
        $this->authorize('update', $customer);

        return Inertia::render('customers/edit', [
            'customer' => CustomerResource::make($customer)->resolve(),
        ]);
    }

    public function show(Customer $customer)
    {
        $this->authorize('view', $customer);

        $sites = Site::query()
            ->where('customer_id', $customer->id)
            ->latest()
            ->get();

        $offers = Offer::query()
            ->where('customer_id', $customer->id)
            ->with('site')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('customers/show', [
            'customer' => CustomerResource::make($customer)->resolve(),
            'sites' => SiteResource::collection($sites),
            'offers' => OfferResource::collection($offers),
            'stats' => [
                'sites' => $sites->count(),
                'offers' => $offers->count(),
            ],
        ]);
    }

    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        $this->authorize('update', $customer);

        $customer->update($request->validated());

        return redirect()
            ->route('customers.edit', $customer)
            ->with('success', 'Kunde aktualisiert.');
    }

    public function destroy(Customer $customer)
    {
        $this->authorize('delete', $customer);

        $customer->delete();

        return redirect()
            ->route('customers.index')
            ->with('success', 'Kunde gelöscht.');
    }
}
