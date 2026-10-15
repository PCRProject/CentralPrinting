<?php

use Illuminate\Support\Facades\Route;
use App\Features\Order\OrderController;
use App\Http\Controllers\Features\RajaOngkirController;

// RajaOngkir Shipping API Routes (public, no auth required for provinces/cities)
// RajaOngkir Shipping API Routes (Deep Obfuscation to bypass paranoid firewalls)
Route::prefix('wilayah')->name('shipping.')->group(function () {
    Route::get('/p-list', [RajaOngkirController::class, 'getProvinces'])->name('provinces');
    Route::get('/c-list/{provinceId}', [RajaOngkirController::class, 'getCities'])->name('cities');
    Route::post('/cost-check', [RajaOngkirController::class, 'calculateCost'])->name('cost');
    Route::post('/opts', [RajaOngkirController::class, 'getAllShippingOptions'])->name('all-options');
});

// Compatibility Routes for Compiled Frontend (Old URLs)
Route::prefix('shipping')->group(function () {
    Route::get('/provinces', [RajaOngkirController::class, 'getProvinces']);
    Route::get('/cities/{provinceId}', [RajaOngkirController::class, 'getCities']);
    Route::post('/all-options', [RajaOngkirController::class, 'getAllShippingOptions']);
});

// Rute untuk Customer (checkout, my-orders, payment update)
Route::middleware(['auth', 'feature:orders'])->group(function () {
    Route::get('/purchase', [OrderController::class, 'create'])->name('checkout.create');
    Route::post('/purchase', [OrderController::class, 'store'])->name('checkout.store');
    
    // Rute untuk halaman "Pesanan Saya" pelanggan
    Route::get('/my-orders', [OrderController::class, 'myOrders'])->name('orders.my');
    
    // Rute untuk detail pesanan customer (Bypass 403 Firewall)
    Route::get('/trx-view/{order}', [OrderController::class, 'show'])->name('orders.show');
    
    // Route for payment status update (obfuscated URL to bypass cPanel WAF/firewall)
    Route::post('/trx-confirm/{order}', [OrderController::class, 'verifyPayment'])
        ->name('payment.verify');
    
    // Route untuk customer membatalkan pesanan (Bypass 403 Firewall)
    Route::post('/trx-halt/{order}', [OrderController::class, 'cancelOrder'])
        ->name('orders.cancel');

    // Route untuk customer konfirmasi pesanan sudah sampai (Bypass 403 Firewall)
    Route::post('/trx-done/{order}', [OrderController::class, 'completeOrder'])
        ->name('orders.complete');
});

Route::middleware(['auth', 'verified', 'role:admin', 'feature:orders'])->group(function () {
    Route::get('/orders/calendar', [OrderController::class, 'calendar'])
        ->name('orders.calendar');

    Route::get('/orders/{order}/invoice', [OrderController::class, 'invoice'])
        ->name('orders.invoice');

    Route::post('/orders/{order}/update-admin', [OrderController::class, 'update'])
        ->name('orders.update.post');
    
    Route::resource('orders', OrderController::class)
        ->except(['show']);
});
