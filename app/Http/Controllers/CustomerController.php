<?php

namespace App\Http\Controllers;

use App\Models\Cafe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $cafes = Cafe::with(['photos', 'menus'])->latest()->get();
        $cafeItems = $cafes->map(fn ($cafe) => CafeController::transformCafe($cafe))->values()->all();

        return Inertia::render('customer/index', [
            "cafes" => $cafeItems,
        ]);
    }

    public function show($id)
    {
        $cafe = Cafe::with(['photos', 'menus'])->findOrFail($id);
        $cafeItem = CafeController::transformCafe($cafe);

        return Inertia::render('customer/detail-cafes', [
            "cafe" => $cafeItem
        ]);
    }
}
