<?php

use App\Features\Product\ProductController;
use App\Http\Controllers\Features\CartController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

use App\Models\AppSetting;

// Halaman Utama: dinamis berdasarkan saklar customer_portal di Pengaturan Admin
Route::get('/', function () {
    if (AppSetting::isEnabled('customer_portal')) {
        return app(WelcomeController::class)->index();
    }

    if (auth()->check() && auth()->user()->role === 'admin') {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
})->name('welcome');

// Rute Publik & Pelanggan: Dikontrol oleh saklar fitur customer_portal
Route::middleware(['feature:customer_portal'])->group(function () {
    Route::get('/api/products/{product:slug}', [ProductController::class, 'quickView'])->name('products.quickView');
    Route::get('/api/cart/{cartItemId}', [CartController::class, 'getItemDetails'])->name('cart.itemDetails');

    // Rute untuk Keranjang Belanja
    Route::prefix('cart')->name('cart.')->group(function () {
        Route::get('/', [CartController::class, 'index'])->name('index');
        Route::post('/', [CartController::class, 'store'])->name('store');
        Route::patch('/{cartItemId}', [CartController::class, 'update'])->name('update');
        Route::post('/{cartItemId}/update', [CartController::class, 'update'])->name('update.post');
        Route::delete('/{cartItemId}', [CartController::class, 'destroy'])->name('destroy');
        Route::post('/{cartItemId}/remove', [CartController::class, 'destroy'])->name('destroy.remove');
    });

    // Rute untuk Halaman Toko "Produk & Jasa"
    Route::get('/produk-jasa', [ProductController::class, 'shopIndex'])
         ->name('shop.index');

    // Rute untuk Portofolio
    Route::get('/portfolio', [\App\Features\Portfolio\PortfolioController::class, 'index'])
        ->name('portfolio.index');
});

// Rute khusus Admin
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // Report download routes
    Route::get('/reports/download/pdf', [\App\Http\Controllers\ReportController::class, 'downloadPdf'])->name('reports.pdf');
    Route::get('/reports/download/excel', [\App\Http\Controllers\ReportController::class, 'downloadExcel'])->name('reports.excel');
});


require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
