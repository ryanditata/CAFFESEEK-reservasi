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
        $cafes = Cafe::with(['menus', 'tables'])->get();

        return Inertia::render('admin/dashboard/index', [
            'cafes' => $cafes
        ]);
    }
}
