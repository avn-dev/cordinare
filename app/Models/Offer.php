<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    use BelongsToTenant;
    use Auditable;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'customer_id',
        'site_id',
        'number',
        'version',
        'status',
        'currency',
        'valid_until',
        'notes',
        'sent_at',
        'accepted_at',
        'rejected_at',
        'pdf_path',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OfferItem::class);
    }

    public function serviceReport(): HasOne
    {
        return $this->hasOne(ServiceReport::class);
    }

    public function totalAmount(): float
    {
        return $this->items->sum(fn (OfferItem $item) => $item->quantity * $item->unit_price);
    }
}
