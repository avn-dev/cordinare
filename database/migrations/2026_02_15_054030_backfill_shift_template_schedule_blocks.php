<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('shift_templates')) {
            return;
        }

        $templates = DB::table('shift_templates')->get();
        foreach ($templates as $template) {
            $blocks = $template->schedule_blocks ? json_decode($template->schedule_blocks, true) : null;
            if (! is_array($blocks) || $blocks === []) {
                $blocks = [[
                    'day_of_week' => (int) $template->day_of_week,
                    'starts_at' => $template->starts_at,
                    'ends_at' => $template->ends_at,
                ]];
            }

            $daysMask = 0;
            foreach ($blocks as $block) {
                $daysMask |= 1 << (int) $block['day_of_week'];
            }

            DB::table('shift_templates')
                ->where('id', $template->id)
                ->update([
                    'schedule_blocks' => json_encode($blocks),
                    'days_mask' => $daysMask,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('shift_templates')) {
            return;
        }

        DB::table('shift_templates')->update([
            'schedule_blocks' => null,
            'days_mask' => 0,
        ]);
    }
};
