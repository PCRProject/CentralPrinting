<?php

use Illuminate\Support\Facades\Route;
use App\Features\Review\ReviewController;

Route::resource('reviews', ReviewController::class)->middleware(['auth', 'verified', 'feature:reviews']);
Route::post('reviews/{review}/update', [ReviewController::class, 'update'])->name('reviews.update.post')->middleware(['auth', 'verified', 'feature:reviews']);
Route::get('/ulasan-produk/{order}', [ReviewController::class, 'createForOrder'])
    ->name('reviews.create-for-order')
    ->middleware(['auth', 'verified', 'feature:reviews']);
