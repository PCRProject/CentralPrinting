<?php

use Illuminate\Support\Facades\Route;
use App\Features\Customer\CustomerController;

Route::resource('customers', CustomerController::class)->middleware(['auth', 'verified', 'role:admin', 'feature:customers']);
