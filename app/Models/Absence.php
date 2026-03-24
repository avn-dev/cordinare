<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToTenant;
use App\Support\Rules\RuleEngine;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class Absence extends Model
{
    use BelongsToTenant;
    use Auditable;
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (self $absence): void {
            $absence->rule_flags = app(RuleEngine::class)->evaluateAbsence($absence);
        });
    }

    protected $fillable = [
        'tenant_id',
        'user_id',
        'type',
        'starts_on',
        'ends_on',
        'status',
        'notes',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'rule_flags' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
