<?php

use App\Features\Store\StoreController;
use Illuminate\Support\Facades\Route;

// Admin routes for store management
Route::middleware(['auth', 'role:admin', 'feature:stores'])->prefix('stores')->group(function () {
    Route::get('/', [StoreController::class, 'index'])->name('stores.index');
    Route::get('/create', [StoreController::class, 'create'])->name('stores.create');
    Route::post('/', [StoreController::class, 'store'])->name('stores.store');
    Route::get('/{store}/edit', [StoreController::class, 'edit'])->name('stores.edit');
    Route::put('/{store}', [StoreController::class, 'update'])->name('stores.update');
    Route::post('/{store}/update', [StoreController::class, 'update'])->name('stores.update.post');
    Route::delete('/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');
    Route::post('/{store}/remove', [StoreController::class, 'destroy'])->name('stores.destroy.remove');
});

// Public route for store locations
Route::middleware(['feature:stores'])->group(function () {
    Route::get('/lokasi-toko', [StoreController::class, 'locations'])->name('locations.index');
});
