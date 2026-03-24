<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class CordinareExportLeads extends Command
{
    protected $signature = 'cordinare:leads:export
                            {tenant : Tenant ID}
                            {--path= : Output path (default: storage/app/exports)}
                            {--force : Overwrite if file exists}';

    protected $description = 'Export leads to CSV for a tenant';

    public function handle(): int
    {
        $tenantId = $this->argument('tenant');
        $tenant = Tenant::find($tenantId);

        if (! $tenant) {
            $this->error('Tenant not found.');
            return self::FAILURE;
        }

        $directory = $this->option('path') ?: storage_path('app/exports');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filename = 'leads-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
        $path = rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$filename;

        if (file_exists($path) && ! $this->option('force')) {
            $this->error('File already exists. Use --force to overwrite.');
            return self::FAILURE;
        }

        $handle = fopen($path, 'w');
        if (! $handle) {
            $this->error('Unable to open output file.');
            return self::FAILURE;
        }

        fputcsv($handle, [
            'id',
            'status',
            'name',
            'email',
            'phone',
            'message',
            'source',
            'tags',
            'follow_up_at',
            'created_at',
        ]);

        Lead::query()
            ->where('tenant_id', $tenant->id)
            ->orderBy('created_at')
            ->chunk(200, function ($leads) use ($handle) {
                foreach ($leads as $lead) {
                    fputcsv($handle, [
                        $lead->id,
                        $lead->status,
                        $lead->name,
                        $lead->email,
                        $lead->phone,
                        $lead->message,
                        $lead->source,
                        $lead->tags ? json_encode($lead->tags) : null,
                        optional($lead->follow_up_at)->toIso8601String(),
                        optional($lead->created_at)->toIso8601String(),
                    ]);
                }
            });

        fclose($handle);

        $this->info('Exported leads to: '.$path);

        return self::SUCCESS;
    }
}
