<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('shift_templates', function (Blueprint $table) {
            $table->json('schedule_blocks')->nullable()->after('name');
            $table->unsignedSmallInteger('days_mask')->default(0)->after('schedule_blocks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shift_templates', function (Blueprint $table) {
            $table->dropColumn('days_mask');
            $table->dropColumn('schedule_blocks');
        });
    }
};
