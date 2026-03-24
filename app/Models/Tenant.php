<?php

namespace App\Models;

use App\Support\Security\ApiKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'slug',
        'timezone',
        'locale',
        'data_retention_days',
        'api_key_hash',
        'api_key_prefix',
        'api_key_last_four',
    ];

    protected $hidden = [
        'api_key_hash',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function setApiKey(string $plainTextKey): void
    {
        $this->api_key_hash = ApiKey::hash($plainTextKey);
        $this->api_key_prefix = ApiKey::prefix($plainTextKey);
        $this->api_key_last_four = ApiKey::lastFour($plainTextKey);
    }
}
