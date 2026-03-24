<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use App\Support\Security\ApiKey;

class CordinareCreateTenant extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cordinare:tenant:create
                            {name : Tenant name}
                            {--slug= : Custom slug (default: slugified name)}
                            {--email= : Optional admin email}
                            {--password= : Optional admin password}
                            {--no-user : Skip creating an admin user}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a tenant with a secure API key (optionally create an admin user)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $name = trim($this->argument('name'));
        $slug = $this->option('slug') ?: Str::slug($name);

        $plainKey = ApiKey::generate();

        $tenant = Tenant::create([
            'name' => $name,
            'slug' => $slug,
            'timezone' => config('app.timezone', 'Europe/Berlin'),
            'locale' => config('app.locale', 'de'),
            'data_retention_days' => 365,
            'api_key_hash' => ApiKey::hash($plainKey),
            'api_key_prefix' => ApiKey::prefix($plainKey),
            'api_key_last_four' => ApiKey::lastFour($plainKey),
        ]);

        $this->info('Tenant created.');
        $this->line('Tenant ID: '.$tenant->id);
        $this->line('Tenant Slug: '.$tenant->slug);
        $this->line('API Key (store securely, shown once): '.$plainKey);

        if (! $this->option('no-user')) {
            $email = $this->option('email') ?: $this->ask('Admin email');
            $password = $this->option('password') ?: $this->secret('Admin password (min 12 chars)');

            if (! $email || ! $password) {
                $this->warn('Admin user skipped (missing email or password).');
                return self::SUCCESS;
            }

            if (strlen($password) < 12) {
                $this->error('Password too short. Minimum 12 characters.');
                return self::FAILURE;
            }

            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => 'Admin',
                'email' => $email,
                'password' => Hash::make($password),
                'role' => \App\Enums\UserRole::FirmAdmin,
            ]);

            $this->info('Admin user created: '.$user->email);
        }

        return self::SUCCESS;
    }
}
