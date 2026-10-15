<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            $featuresDir = base_path('routes/features');
            if (file_exists($featuresDir)) {
                foreach (scandir($featuresDir) as $file) {
                    if (pathinfo($file, PATHINFO_EXTENSION) === 'php') {
                        Route::middleware('web')->group(base_path('routes/features/'.$file));
                    }
                }
            }
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'ipn-handler',       // Midtrans webhook (was 'order-notify')
            'trx-confirm/*',     // Frontend payment verify
            'trx-token/*',       // Create snap token
            'api/payment/notification',
            'wilayah/*',
            'shipping/*',
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'feature' => \App\Http\Middleware\CheckFeatureEnabled::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->withCommands([
        \App\Console\Commands\MakeFeatureCommand::class,
        \App\Console\Commands\SyncFeatureCommand::class,
    ])->create();
