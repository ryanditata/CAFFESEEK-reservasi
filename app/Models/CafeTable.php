<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeTable extends Model
{
    use HasFactory;

    protected $guarded = ['id', 'created_at', 'updated_at'];
    
    protected $casts = [
        'table_number' => 'integer',
        'capacity' => 'integer',
    ];

    public function cafe(): BelongsTo
    {
        return $this->belongsTo(Cafe::class);
    }
}