<?php

namespace App\Http\Controllers;

use App\Models\Cafe;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
  public function index(Request $request)
  {
    $cafes = Cafe::with(['photos', 'menus'])->latest()->take(12)->get();
    $cafeItems = $cafes->map(fn ($cafe) => CafeController::transformCafe($cafe))->values()->all();

    // Return Inertia page for initial load and redirects
    return Inertia::render('customer/index', [
      "cafes" => $cafeItems,
    ]);
  }
}
