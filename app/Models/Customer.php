<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'status',
        'contact_name',
        'email',
        'phone',
        'notes',
    ];

    public function sites(): HasMany
    {
        return $this->hasMany(Site::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }
}
