<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => fn() => $request->user() ? $request->user()->only('id', 'name', 'email', 'initials', 'role') : null,
            ],
            'flash' => [
                'message' => fn() => $request->session()->get('message'),
                'error' => fn() => $request->session()->get('error'),
            ],
            'features' => fn() => \App\Models\AppSetting::getFeatures(),
            'cart' => function () {
                $cart = session('cart', ['items' => [], 'subtotal' => 0]);
                // Mengubah logika untuk menghitung jumlah item unik, bukan total kuantitas
                $quantity = is_array($cart['items']) ? count($cart['items']) : 0;
                return [
                    'items' => $cart['items'],
                    'subtotal' => $cart['subtotal'],
                    'quantity' => $quantity,
                ];
            },
            'categories' => fn() => \App\Features\Product\Category::select('name')->distinct()->orderBy('name')->pluck('name')->values()->toArray(),
        ]);
    }
}
