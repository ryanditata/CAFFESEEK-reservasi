<?php

use App\Http\Controllers\CafeController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [CustomerController::class, 'index'])->name('home');

// !important: This route will be using middleware 'auth' and 'verified' in the admin prefix group
Route::POST('/print', [PrintController::class, 'index'])->name('print.index');

Route::prefix('admin')->middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('admin/dashboard/index');
    })->name('admin.dashboard');

    // Caffe & Resto advanced directory
    Route::resource('cafes', CafeController::class);
});
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
