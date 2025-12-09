<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
    $cafes = Cafe::with([
        'menus',
        'tables',
        'photos' => function ($q) {
            $q->orderByDesc('is_primary');
        }
    ])->get();

    $chartData = Cafe::selectRaw("strftime('%m', created_at) as month, COUNT(*) as total")
        ->whereRaw("strftime('%Y', created_at) = ?", [now()->format('Y')])
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(function($row) {
            $monthNumber = (int) $row->month;
            return [
                'month' => date('M', mktime(0, 0, 0, $monthNumber, 1)),
                'total' => $row->total
            ];
    });

    return Inertia::render('admin/dashboard/index', [
        'cafes' => $cafes,
        'chartData' => $chartData
    ]);
    }
}
