<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_status', 50)->default('pending')->change();
            $table->text('shipping_address')->nullable()->change();
            if (!Schema::hasColumn('orders', 'order_source')) {
                $table->string('order_source', 50)->default('online')->after('admin_notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'order_source')) {
                $table->dropColumn('order_source');
            }
        });
    }
};
