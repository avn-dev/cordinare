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
        if (! Schema::hasTable('shift_templates')) {
            Schema::create('shift_templates', function (Blueprint $table) {
                $table->id();
                $table->uuid('tenant_id');
                $table->foreignId('site_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->unsignedTinyInteger('day_of_week');
                $table->time('starts_at');
                $table->time('ends_at');
                $table->string('status')->default('scheduled');
                $table->boolean('active')->default(true);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'site_id']);
                $table->index(['tenant_id', 'day_of_week']);
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('site_closures')) {
            Schema::create('site_closures', function (Blueprint $table) {
                $table->id();
                $table->uuid('tenant_id');
                $table->foreignId('site_id')->constrained()->cascadeOnDelete();
                $table->unsignedTinyInteger('day_of_week');
                $table->time('starts_at');
                $table->time('ends_at');
                $table->string('label')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'site_id']);
                $table->index(['tenant_id', 'day_of_week']);
                $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            });
        }

        if (! Schema::hasTable('shift_template_user')) {
            Schema::create('shift_template_user', function (Blueprint $table) {
                $table->id();
                $table->foreignId('shift_template_id')->constrained('shift_templates')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['shift_template_id', 'user_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_template_user');
        Schema::dropIfExists('site_closures');
        Schema::dropIfExists('shift_templates');
    }
};
