<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\Exports\TimeEntryCsvExporter;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CordinareExportTimeEntries extends Command
{
    protected $signature = 'cordinare:time-entries:export
                            {tenant : Tenant ID}
                            {--path= : Output path (default: storage/app/exports)}
                            {--force : Overwrite if file exists}
                            {--user= : Filter by user ID}
                            {--shift= : Filter by shift ID}
                            {--from= : Filter by date (YYYY-MM-DD)}
                            {--to= : Filter by date (YYYY-MM-DD)}
                            {--flag= : Filter by anomaly flag}';

    protected $description = 'Export time entries to CSV for a tenant';

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

        $filename = 'time-entries-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
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

        $filters = [
            'user_id' => $this->option('user'),
            'shift_id' => $this->option('shift'),
            'from' => $this->option('from'),
            'to' => $this->option('to'),
            'flag' => $this->option('flag'),
        ];

        TimeEntryCsvExporter::writeToHandle($handle, $tenant->id, $filters);

        fclose($handle);

        $this->info('Exported time entries to: '.$path);

        return self::SUCCESS;
    }
}
