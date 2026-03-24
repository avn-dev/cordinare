<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\Security\ApiKey;
use Illuminate\Console\Command;

class CordinareRotateTenantKey extends Command
{
    protected $signature = 'cordinare:tenant:rotate-key
                            {tenant : Tenant ID}
                            {--show-old : Show last 4 of previous key}';

    protected $description = 'Rotate API key for a tenant';

    public function handle(): int
    {
        $tenantId = $this->argument('tenant');
        $tenant = Tenant::find($tenantId);

        if (! $tenant) {
            $this->error('Tenant not found.');
            return self::FAILURE;
        }

        $oldLastFour = $tenant->api_key_last_four;
        $plainKey = ApiKey::generate();

        $tenant->api_key_hash = ApiKey::hash($plainKey);
        $tenant->api_key_prefix = ApiKey::prefix($plainKey);
        $tenant->api_key_last_four = ApiKey::lastFour($plainKey);
        $tenant->save();

        $this->info('API key rotated.');
        $this->line('Tenant ID: '.$tenant->id);
        if ($this->option('show-old') && $oldLastFour) {
            $this->line('Previous key last 4: '.$oldLastFour);
        }
        $this->line('New API Key (store securely, shown once): '.$plainKey);

        return self::SUCCESS;
    }
}
