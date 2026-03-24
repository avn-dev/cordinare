<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Support\Exports\AuditLogCsvExporter;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CordinareExportAuditLogs extends Command
{
    protected $signature = 'cordinare:audit-logs:export
                            {tenant : Tenant ID}
                            {--path= : Output path (default: storage/app/exports)}
                            {--force : Overwrite if file exists}
                            {--action= : Filter by action}
                            {--type= : Filter by auditable type}
                            {--actor= : Filter by actor ID}
                            {--request-id= : Filter by request ID}
                            {--from= : Filter by date (YYYY-MM-DD)}
                            {--to= : Filter by date (YYYY-MM-DD)}';

    protected $description = 'Export audit logs to CSV for a tenant';

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

        $filename = 'audit-logs-'.$tenant->slug.'-'.Carbon::now()->format('Ymd_His').'.csv';
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
            'action' => $this->option('action'),
            'auditable_type' => $this->option('type'),
            'actor_id' => $this->option('actor'),
            'request_id' => $this->option('request-id'),
            'from' => $this->option('from'),
            'to' => $this->option('to'),
        ];

        AuditLogCsvExporter::writeToHandle($handle, $tenant->id, $filters);

        fclose($handle);

        $this->info('Exported audit logs to: '.$path);

        return self::SUCCESS;
    }
}
