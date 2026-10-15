<?php
use App\Features\Product\ProductController;
use Illuminate\Support\Facades\Route;

// Rute untuk admin (perlu login dan peran admin)
// DITEMPATKAN DI ATAS UNTUK PRIORITAS
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('products')->name('products.')->group(function () {
    Route::get('/', [ProductController::class, 'index'])->name('index');
    Route::get('/create', [ProductController::class, 'create'])->name('create');
    Route::post('/', [ProductController::class, 'store'])->name('store');
    Route::get('/{product:id_produk}/edit', [ProductController::class, 'edit'])->name('edit');
    Route::put('/{product:id_produk}', [ProductController::class, 'update'])->name('update');
    Route::delete('/{product:id_produk}', [ProductController::class, 'destroy'])->name('destroy');
    Route::post('/{product:id_produk}/remove', [ProductController::class, 'destroy'])->name('destroy.remove');
    Route::patch('/{product:id_produk}/toggle-status', [ProductController::class, 'toggleStatus'])->name('toggleStatus');
    Route::post('/{product:id_produk}/toggle-status', [ProductController::class, 'toggleStatus'])->name('toggleStatus.post');
});

// Rute detail produk (dibatasi khusus Admin selama pemeliharaan fitur pelanggan)
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
});
