<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->string('qm_token', 64)->nullable()->unique()->after('special_instructions');
        });

        DB::table('sites')
            ->whereNull('qm_token')
            ->orderBy('id')
            ->chunkById(200, function ($sites) {
                foreach ($sites as $site) {
                    DB::table('sites')
                        ->where('id', $site->id)
                        ->update(['qm_token' => Str::random(40)]);
                }
            });

        // Keep nullable to avoid requiring DBAL for column changes.
    }

    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropUnique(['qm_token']);
            $table->dropColumn('qm_token');
        });
    }
};
