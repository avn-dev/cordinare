<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteClosure extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'site_id',
        'closure_type',
        'day_of_week',
        'starts_on',
        'ends_on',
        'starts_at',
        'ends_at',
        'label',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'starts_on' => 'date',
        'ends_on' => 'date',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
