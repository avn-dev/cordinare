<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\Absence;
use App\Models\Lead;
use App\Models\Offer;
use App\Models\OfferItem;
use App\Models\Shift;
use App\Models\Assignment;
use App\Models\TimeEntry;
use App\Models\Site;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Security\ApiKey;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CordinareSeedDemoData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cordinare:demo:seed
                            {--tenant= : Existing tenant ID}
                            {--email=demo@cordinare.local : Admin email}
                            {--password= : Admin password (min 12 chars)}
                            {--leads=15 : Number of leads}
                            {--customers=5 : Number of customers}
                            {--sites=10 : Number of sites}
                            {--offers=6 : Number of offers}
                            {--shifts=6 : Number of shifts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed demo data (tenant, admin user, leads)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $leadCount = (int) $this->option('leads');
        $customerCount = (int) $this->option('customers');
        $siteCount = (int) $this->option('sites');
        $offerCount = (int) $this->option('offers');
        $shiftCount = (int) $this->option('shifts');
        $tenantId = $this->option('tenant');

        if ($leadCount < 1 || $customerCount < 1 || $siteCount < 1 || $offerCount < 1 || $shiftCount < 1) {
            $this->error('Counts must be at least 1.');
            return self::FAILURE;
        }

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (! $tenant) {
                $this->error('Tenant not found.');
                return self::FAILURE;
            }
        } else {
            $plainKey = ApiKey::generate();
            $tenant = Tenant::create([
                'name' => 'Demo Cordinare GmbH',
                'slug' => 'demo-'.Str::random(6),
                'timezone' => config('app.timezone', 'Europe/Berlin'),
                'locale' => config('app.locale', 'de'),
                'data_retention_days' => 365,
                'api_key_hash' => ApiKey::hash($plainKey),
                'api_key_prefix' => ApiKey::prefix($plainKey),
                'api_key_last_four' => ApiKey::lastFour($plainKey),
            ]);

            $this->info('Demo tenant created.');
            $this->line('Tenant ID: '.$tenant->id);
            $this->line('Tenant Slug: '.$tenant->slug);
            $this->line('API Key (store securely, shown once): '.$plainKey);
        }

        $email = $this->option('email') ?: 'demo@cordinare.local';
        $password = $this->option('password') ?: $this->secret('Admin password (min 12 chars)');

        if (! $password || strlen($password) < 12) {
            $this->error('Password too short. Minimum 12 characters.');
            return self::FAILURE;
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Demo Admin',
                'password' => Hash::make($password),
                'role' => UserRole::FirmAdmin,
            ]
        );

        if ($user->tenant_id !== $tenant->id) {
            $user->tenant_id = $tenant->id;
            $user->save();
        }

        $customers = Customer::factory()
            ->count($customerCount)
            ->create(['tenant_id' => $tenant->id]);

        Lead::factory()
            ->count($leadCount)
            ->create(['tenant_id' => $tenant->id]);

        $siteCountPerCustomer = max(1, (int) floor($siteCount / max(1, $customers->count())));

        $customers->each(function (Customer $customer) use ($siteCountPerCustomer, $tenant) {
            Site::factory()
                ->count($siteCountPerCustomer)
                ->create([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id,
                ]);
        });

        $customerIds = $customers->pluck('id')->all();
        $siteIds = Site::query()->where('tenant_id', $tenant->id)->pluck('id')->all();

        $offers = collect(range(1, $offerCount))->map(function () use ($tenant, $customerIds, $siteIds) {
            return Offer::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customerIds[array_rand($customerIds)],
                'site_id' => $siteIds ? $siteIds[array_rand($siteIds)] : null,
            ]);
        });

        $offers->each(function (Offer $offer) use ($tenant) {
            OfferItem::factory()
                ->count(3)
                ->create([
                    'tenant_id' => $tenant->id,
                    'offer_id' => $offer->id,
                ]);
        });

        $employee = User::firstOrCreate(
            ['email' => 'mitarbeiter@cordinare.local'],
            [
                'tenant_id' => $tenant->id,
                'name' => 'Demo Mitarbeiter',
                'password' => Hash::make('ChangeMe123456'),
                'role' => UserRole::Employee,
            ]
        );

        $employee->tenant_id = $tenant->id;
        $employee->role = UserRole::Employee;
        $employee->save();

        $shiftSiteIds = Site::query()->where('tenant_id', $tenant->id)->pluck('id')->all();
        $shifts = collect(range(1, $shiftCount))->map(function () use ($tenant, $shiftSiteIds) {
            return Shift::factory()->create([
                'tenant_id' => $tenant->id,
                'site_id' => $shiftSiteIds[array_rand($shiftSiteIds)],
            ]);
        });

        $shifts->each(function (Shift $shift) use ($tenant, $employee) {
            Assignment::factory()->create([
                'tenant_id' => $tenant->id,
                'shift_id' => $shift->id,
                'user_id' => $employee->id,
                'role' => 'employee',
            ]);

            TimeEntry::factory()->create([
                'tenant_id' => $tenant->id,
                'shift_id' => $shift->id,
                'user_id' => $employee->id,
            ]);
        });

        Absence::factory()
            ->count(2)
            ->create([
                'tenant_id' => $tenant->id,
                'user_id' => $employee->id,
            ]);

        $this->info('Seeded '.$leadCount.' leads, '.$customerCount.' customers, '.$siteCount.' sites, '.$offerCount.' offers, '.$shiftCount.' shifts for tenant '.$tenant->id.'.');
        $this->info('Login: '.$user->email);
        $this->info('Employee Login: mitarbeiter@cordinare.local (ChangeMe123456)');

        return self::SUCCESS;
    }
}
