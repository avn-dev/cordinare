<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\Exports\AbsenceCsvExporter;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CordinareExportAbsences extends Command
{
    protected $signature = 'cordinare:absences:export
                            {tenant : Tenant ID}
                            {--path= : Output path (default: storage/app/exports)}
                            {--force : Overwrite if file exists}
                            {--status= : Filter by status (pending/approved/rejected)}
                            {--type= : Filter by type (vacation/sick/special)}
                            {--user= : Filter by user ID}
                            {--from= : Filter by start date (YYYY-MM-DD)}
                            {--to= : Filter by end date (YYYY-MM-DD)}
                            {--flag= : Filter by rule flag}';

    protected $description = 'Export absences to CSV for a tenant';

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

        $filename = 'absences-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
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
            'status' => $this->option('status'),
            'type' => $this->option('type'),
            'user_id' => $this->option('user'),
            'from' => $this->option('from'),
            'to' => $this->option('to'),
            'flag' => $this->option('flag'),
        ];

        AbsenceCsvExporter::writeToHandle($handle, $tenant->id, $filters);

        fclose($handle);

        $this->info('Exported absences to: '.$path);

        return self::SUCCESS;
    }
}
