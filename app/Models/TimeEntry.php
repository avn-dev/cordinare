<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class TimeEntry extends Model
{
    use BelongsToTenant;
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'shift_id',
        'user_id',
        'check_in_at',
        'check_out_at',
        'break_minutes',
        'gps',
        'notes',
    ];

    protected $casts = [
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'gps' => 'array',
        'anomaly_flags' => 'array',
    ];

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
