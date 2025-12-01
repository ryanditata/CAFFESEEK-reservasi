<?php

use App\Http\Controllers\CafeController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [CustomerController::class, 'index'])->name('home');
Route::get('/cafes/{id}', [CustomerController::class, 'show'])->name('customer.cafes.show');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('admin/dashboard/index');
    })->name('admin.dashboard');

    Route::resource('cafes', CafeController::class);
});
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
