<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteIssueFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_issue_id',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    public function issue(): BelongsTo
    {
        return $this->belongsTo(SiteIssue::class, 'site_issue_id');
    }
}
