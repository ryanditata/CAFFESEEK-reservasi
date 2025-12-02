<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cafe extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'operational_hours' => 'array',
        'has_colokan' => 'boolean',
        'has_wifi' => 'boolean',
        'has_indoor' => 'boolean',
        'has_outdoor' => 'boolean',
        'has_smoking_area' => 'boolean',
        'meeting_room_available' => 'boolean',
        'meeting_room_capacity' => 'integer',
    ];

    public function photos(): HasMany
    {
        return $this->hasMany(CafePhoto::class)->orderBy('sort_order');
    }

    public function menus(): HasMany
    {
        return $this->hasMany(CafeMenu::class)->orderBy('name');
    }
    public function tables(): HasMany
    {
        return $this->hasMany(CafeTable::class);
    }
}

