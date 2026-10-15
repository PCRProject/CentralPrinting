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
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('features');
            $table->string('label');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Inisialisasi fitur default sistem
        $defaultFeatures = [
            [
                'key' => 'customer_portal',
                'value' => '0', // Dimatikan sementara sesuai permintaan user
                'group' => 'features',
                'label' => 'Portal Pelanggan & Toko Publik',
                'description' => 'Mengaktifkan landing page, katalog publik, etalase produk, keranjang belanja, checkout, dan registrasi pelanggan.',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'orders',
                'value' => '1',
                'group' => 'features',
                'label' => 'Modul Pesanan',
                'description' => 'Mengaktifkan manajemen transaksi dan pemrosesan pesanan di panel admin.',
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'products',
                'value' => '1',
                'group' => 'features',
                'label' => 'Modul Produk & Jasa',
                'description' => 'Mengaktifkan katalog produk, kategori, varian atribut, dan template desain.',
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'customers',
                'value' => '1',
                'group' => 'features',
                'label' => 'Modul Pelanggan',
                'description' => 'Mengaktifkan direktori dan manajemen data akun pelanggan terdaftar.',
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'reviews',
                'value' => '1',
                'group' => 'features',
                'label' => 'Modul Ulasan & Rating',
                'description' => 'Mengaktifkan pengelolaan ulasan pelanggan dan testimoni produk.',
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'stores',
                'value' => '1',
                'group' => 'features',
                'label' => 'Modul Toko & Lokasi',
                'description' => 'Mengaktifkan manajemen cabang toko fisik dan integrasi peta lokasi.',
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        \Illuminate\Support\Facades\DB::table('app_settings')->insert($defaultFeatures);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
