<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ShiftTemplate extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'site_id',
        'name',
        'schedule_blocks',
        'days_mask',
        'day_of_week',
        'starts_at',
        'ends_at',
        'status',
        'active',
        'notes',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'days_mask' => 'integer',
        'schedule_blocks' => 'array',
        'active' => 'boolean',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'shift_template_user');
    }
}
