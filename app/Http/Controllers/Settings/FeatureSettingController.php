<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeatureSettingController extends Controller
{
    /**
     * Tampilkan halaman pengaturan fitur aplikasi.
     */
    public function index(): Response
    {
        $settings = AppSetting::where('group', 'features')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($item) {
                return [
                    'key' => $item->key,
                    'label' => $item->label,
                    'description' => $item->description,
                    'enabled' => (bool) $item->value,
                ];
            });

        return Inertia::render('settings/features', [
            'featuresList' => $settings,
        ]);
    }

    /**
     * Perbarui status aktif/nonaktif fitur aplikasi.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|exists:app_settings,key',
            'enabled' => 'required|boolean',
        ]);

        AppSetting::setFeature($validated['key'], $validated['enabled']);

        $setting = AppSetting::where('key', $validated['key'])->first();
        $label = $setting ? $setting->label : $validated['key'];
        $statusText = $validated['enabled'] ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('message', "{$label} berhasil {$statusText}.");
    }
}
