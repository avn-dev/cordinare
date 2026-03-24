<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CordinareCreateUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cordinare:user:create
                            {tenant : Tenant ID}
                            {email : User email}
                            {--name=Admin : User name}
                            {--role=firm_admin : User role}
                            {--password= : User password (min 12 chars)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a user for a tenant';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $tenantId = $this->argument('tenant');
        $email = $this->argument('email');
        $name = $this->option('name') ?: 'Admin';
        $roleInput = $this->option('role') ?: UserRole::FirmAdmin->value;
        $password = $this->option('password') ?: $this->secret('Password (min 12 chars)');

        $tenant = Tenant::find($tenantId);

        if (! $tenant) {
            $this->error('Tenant not found.');
            return self::FAILURE;
        }

        $role = UserRole::tryFrom($roleInput);
        if (! $role) {
            $this->error('Invalid role. Allowed: '.implode(', ', array_map(fn (UserRole $r) => $r->value, UserRole::cases())));
            return self::FAILURE;
        }

        if (! $password || strlen($password) < 12) {
            $this->error('Password too short. Minimum 12 characters.');
            return self::FAILURE;
        }

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => $role,
        ]);

        $this->info('User created: '.$user->email.' ('.$user->role->value.')');

        return self::SUCCESS;
    }
}
