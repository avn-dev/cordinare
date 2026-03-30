<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Site extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'name',
        'status',
        'starts_on',
        'address_line1',
        'address_line2',
        'postal_code',
        'city',
        'country',
        'latitude',
        'longitude',
        'time_windows',
        'access_notes',
        'special_instructions',
        'qm_token',
    ];

    protected $casts = [
        'time_windows' => 'array',
        'starts_on' => 'date',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(SiteIssue::class);
    }

    public function closures(): HasMany
    {
        return $this->hasMany(SiteClosure::class);
    }

    protected static function booted(): void
    {
        static::creating(function (Site $site): void {
            if (! $site->qm_token) {
                $site->qm_token = Str::random(40);
            }
        });
    }
}
