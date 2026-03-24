<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConvertLeadRequest;
use App\Http\Resources\LeadResource;
use App\Models\Customer;
use App\Models\Lead;
use App\Models\Site;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function show(Lead $lead)
    {
        $this->authorize('view', $lead);

        return Inertia::render('leads/show', [
            'lead' => LeadResource::make($lead)->resolve(),
        ]);
    }

    public function convert(Lead $lead, ConvertLeadRequest $request)
    {
        $this->authorize('update', $lead);

        $payload = $request->validated();

        if ($lead->converted_customer_id) {
            return redirect()->route('leads.show', $lead)
                ->with('error', 'Lead wurde bereits konvertiert.');
        }

        $customer = DB::transaction(function () use ($lead, $payload) {
            $customer = Customer::create([
                'name' => $payload['customer_name'],
                'status' => $payload['customer_status'] ?? 'active',
                'contact_name' => $payload['contact_name'],
                'email' => $payload['email'],
                'phone' => $payload['phone'],
                'notes' => $payload['notes'],
            ]);

            if (! empty($payload['site_name'])) {
                Site::create([
                    'customer_id' => $customer->id,
                    'name' => $payload['site_name'],
                    'status' => 'active',
                    'address_line1' => $payload['address_line1'] ?? null,
                    'address_line2' => $payload['address_line2'] ?? null,
                    'postal_code' => $payload['postal_code'] ?? null,
                    'city' => $payload['city'] ?? null,
                    'country' => $payload['country'] ?? 'DE',
                    'time_windows' => $payload['time_windows'] ?? [],
                    'access_notes' => $payload['access_notes'] ?? null,
                    'special_instructions' => $payload['special_instructions'] ?? null,
                ]);
            }

            $lead->update([
                'status' => 'converted',
                'converted_customer_id' => $customer->id,
            ]);

            return $customer;
        });

        return redirect()
            ->route('customers.show', $customer)
            ->with('success', 'Lead wurde zu Kunde konvertiert.');
    }
}
