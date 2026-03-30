<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_closures', function (Blueprint $table) {
            $table->string('closure_type')->default('weekly')->after('site_id');
            $table->date('starts_on')->nullable()->after('day_of_week');
            $table->date('ends_on')->nullable()->after('starts_on');
        });
    }

    public function down(): void
    {
        Schema::table('site_closures', function (Blueprint $table) {
            $table->dropColumn(['closure_type', 'starts_on', 'ends_on']);
        });
    }
};
