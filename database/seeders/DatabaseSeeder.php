<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'administrator',
            'email' => 'deni22ti@mahasiswa.pcr.ac.id',
            'password' => Hash::make('11223344'),
            'role' => 'admin',
        ]);

        // Panggil CategorySeeder di sini
        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
            ProductAttributeSeeder::class,
        ]);
    }
}
