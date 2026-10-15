<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureEnabled
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        if (!AppSetting::isEnabled($featureKey)) {
            $featureLabel = match ($featureKey) {
                'customer_portal' => 'Portal Pelanggan & Toko Publik',
                'orders' => 'Modul Pesanan',
                'products' => 'Modul Produk & Jasa',
                'customers' => 'Modul Pelanggan',
                'reviews' => 'Modul Ulasan',
                'stores' => 'Modul Toko & Lokasi',
                default => $featureKey,
            };

            // Jika diakses oleh admin, kembalikan ke dashboard dengan pesan peringatan
            if ($request->user() && method_exists($request->user(), 'isAdmin') && $request->user()->isAdmin()) {
                return redirect()->route('dashboard')->with('error', "Fitur {$featureLabel} saat ini dinonaktifkan di Pengaturan Fitur.");
            }

            // Jika publik/tamu, arahkan ke login
            return redirect()->route('login');
        }

        return $next($request);
    }
}
