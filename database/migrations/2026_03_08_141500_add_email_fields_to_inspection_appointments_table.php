<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inspection_appointments', function (Blueprint $table) {
            $table->string('email_subject')->nullable()->after('notes');
            $table->text('email_body')->nullable()->after('email_subject');
        });
    }

    public function down(): void
    {
        Schema::table('inspection_appointments', function (Blueprint $table) {
            $table->dropColumn(['email_subject', 'email_body']);
        });
    }
};
