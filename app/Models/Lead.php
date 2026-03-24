<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'status',
        'name',
        'email',
        'phone',
        'message',
        'source',
        'tags',
        'meta',
        'follow_up_at',
        'converted_customer_id',
    ];

    protected $casts = [
        'tags' => 'array',
        'meta' => 'array',
        'follow_up_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
