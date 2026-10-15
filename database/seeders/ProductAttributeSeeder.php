<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Features\Product\Product;
use App\Features\Product\Attribute;
use App\Features\Product\AttributeValue;
use Illuminate\Support\Facades\DB;

class ProductAttributeSeeder extends Seeder
{
    /**
     * Run the database seeds for product attributes and variants.
     */
    public function run(): void
    {
        $products = Product::all();

        if ($products->isEmpty()) {
            $this->command->info('Tidak ada produk ditemukan. Jalankan ProductSeeder terlebih dahulu.');
            return;
        }

        // Definisi Atribut Utama & Nilai-nilainya
        $attributesData = [
            'Bahan' => [
                'Flexi Standar 280gr',
                'Flexi Higress 340gr',
                'Flexi Korchin 440gr (Tebal & Halus)',
                'Albatros Indoor (Halus & Doff)',
                'Luster Premium (Tekstur Kulit Jeruk)',
                'Art Paper 120gr',
                'Art Paper 150gr',
                'Art Carton 210gr',
                'Art Carton 260gr',
                'Blues White (BW) Import',
                'Linen Jepang (Tekstur Bergaris)',
                'Jasmine Glitter (Mewah Berkilau)',
                'Stiker Chromo (Glosy Ekonomis)',
                'Stiker Vinyl Glossy (Anti Air)',
                'Stiker Vinyl Doff/Matte (Anti Air)',
                'Stiker Transparan Anti Air',
                'Cotton Combed 30s Premium',
                'Cotton Combed 24s Tebal',
                'Kertas Kraft Tebal 150gr',
                'Ivory Food Grade 300gr',
            ],
            'Ukuran' => [
                'Standar S',
                'Standar M',
                'Standar L',
                'Standar XL',
                'Standar XXL',
                '60 x 160 cm',
                '80 x 180 cm',
                '80 x 200 cm',
                'A5 (14.8 x 21 cm)',
                'A4 (21 x 29.7 cm)',
                'A3+ (32 x 48 cm)',
                'Diameter 4 cm',
                'Diameter 5 cm',
                'Diameter 7 cm',
                '1 x 1 Meter',
                '2 x 1 Meter',
                '3 x 1 Meter',
            ],
            'Finishing / Laminasi' => [
                'Tanpa Laminasi',
                'Laminasi Doff (Matte Halus)',
                'Laminasi Glossy (Mengkilap)',
                'Mata Ayam 4 Sudut',
                'Mata Ayam Keliling (Tiap 50cm)',
                'Kolong Selongsong Kanan Kiri',
                'Kiss Cut (Setengah Putus Lembaran)',
                'Die Cut (Potong Putus Per Pcs)',
                'Spiral Kawat Gantungan',
                'Klem Seng Kalender',
                'Foil Emas / Hotprint Logo',
                'Lipat 2 (Bifold)',
                'Lipat 3 (Trifold)',
            ],
        ];

        // Buat atau temukan Atribut & Nilai di database
        $attributeModelMap = [];
        $attributeValueModelMap = [];

        foreach ($attributesData as $attrName => $values) {
            $attribute = Attribute::firstOrCreate(['name' => $attrName]);
            $attributeModelMap[$attrName] = $attribute;

            foreach ($values as $val) {
                $attrValue = AttributeValue::firstOrCreate([
                    'attribute_id' => $attribute->id,
                    'value' => $val,
                ]);
                $attributeValueModelMap[$attrName][$val] = $attrValue->id;
            }
        }

        // Petakan varian ke masing-masing produk berdasarkan nama atau kategori
        foreach ($products as $product) {
            $nama = strtolower($product->nama_produk);
            $syncData = [];

            // 1. Spanduk / Banner / Neonbox / Large Format
            if (str_contains($nama, 'spanduk') || str_contains($nama, 'backlight') || str_contains($nama, 'neonbox')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Flexi Standar 280gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Flexi Higress 340gr']] = ['price' => 7000];
                $syncData[$attributeValueModelMap['Bahan']['Flexi Korchin 440gr (Tebal & Halus)']] = ['price' => 15000];

                // Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Mata Ayam 4 Sudut']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Mata Ayam Keliling (Tiap 50cm)']] = ['price' => 5000];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Kolong Selongsong Kanan Kiri']] = ['price' => 3000];
            }
            // 2. Roll Up Banner / X Banner / Display
            elseif (str_contains($nama, 'roll up') || str_contains($nama, 'x banner') || str_contains($nama, 'banner')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Flexi Standar 280gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Flexi Higress 340gr']] = ['price' => 10000];
                $syncData[$attributeValueModelMap['Bahan']['Albatros Indoor (Halus & Doff)']] = ['price' => 25000];
                $syncData[$attributeValueModelMap['Bahan']['Luster Premium (Tekstur Kulit Jeruk)']] = ['price' => 35000];

                // Laminasi
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Tanpa Laminasi']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Doff (Matte Halus)']] = ['price' => 10000];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Glossy (Mengkilap)']] = ['price' => 10000];
            }
            // 3. Poster & Flyer & Brosur
            elseif (str_contains($nama, 'poster') || str_contains($nama, 'flyer') || str_contains($nama, 'brosur')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Art Paper 120gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Art Paper 150gr']] = ['price' => 2000];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 210gr']] = ['price' => 3500];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 260gr']] = ['price' => 5000];

                // Laminasi / Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Tanpa Laminasi']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Glossy (Mengkilap)']] = ['price' => 2500];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Doff (Matte Halus)']] = ['price' => 2500];

                if (str_contains($nama, 'brosur')) {
                    $syncData[$attributeValueModelMap['Finishing / Laminasi']['Lipat 3 (Trifold)']] = ['price' => 1500];
                    $syncData[$attributeValueModelMap['Finishing / Laminasi']['Lipat 2 (Bifold)']] = ['price' => 1000];
                }
            }
            // 4. Stiker & Label
            elseif (str_contains($nama, 'stiker') || str_contains($nama, 'label')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Stiker Chromo (Glosy Ekonomis)']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Stiker Vinyl Glossy (Anti Air)']] = ['price' => 5000];
                $syncData[$attributeValueModelMap['Bahan']['Stiker Vinyl Doff/Matte (Anti Air)']] = ['price' => 6000];
                $syncData[$attributeValueModelMap['Bahan']['Stiker Transparan Anti Air']] = ['price' => 8000];

                // Finishing Cutting
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Kiss Cut (Setengah Putus Lembaran)']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Die Cut (Potong Putus Per Pcs)']] = ['price' => 3000];
            }
            // 5. Kartu Nama & Undangan
            elseif (str_contains($nama, 'kartu nama') || str_contains($nama, 'undangan')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 260gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Blues White (BW) Import']] = ['price' => 10000];
                $syncData[$attributeValueModelMap['Bahan']['Linen Jepang (Tekstur Bergaris)']] = ['price' => 15000];
                $syncData[$attributeValueModelMap['Bahan']['Jasmine Glitter (Mewah Berkilau)']] = ['price' => 20000];

                // Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Tanpa Laminasi']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Doff (Matte Halus)']] = ['price' => 10000];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Glossy (Mengkilap)']] = ['price' => 10000];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Foil Emas / Hotprint Logo']] = ['price' => 25000];
            }
            // 6. Kaos / Topi / Garment
            elseif (str_contains($nama, 'kaos') || str_contains($nama, 't-shirt') || str_contains($nama, 'topi')) {
                // Ukuran
                $syncData[$attributeValueModelMap['Ukuran']['Standar S']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Ukuran']['Standar M']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Ukuran']['Standar L']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Ukuran']['Standar XL']] = ['price' => 5000];
                $syncData[$attributeValueModelMap['Ukuran']['Standar XXL']] = ['price' => 10000];

                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Cotton Combed 30s Premium']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Cotton Combed 24s Tebal']] = ['price' => 8000];
            }
            // 7. Kalender & Buku Catatan
            elseif (str_contains($nama, 'kalender') || str_contains($nama, 'buku')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Art Paper 150gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 210gr']] = ['price' => 3000];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 260gr']] = ['price' => 6000];

                // Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Klem Seng Kalender']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Spiral Kawat Gantungan']] = ['price' => 5000];
            }
            // 8. Packaging & Paper Bag
            elseif (str_contains($nama, 'paper bag') || str_contains($nama, 'dus') || str_contains($nama, 'kemasan')) {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Kertas Kraft Tebal 150gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Ivory Food Grade 300gr']] = ['price' => 4000];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 260gr']] = ['price' => 3000];

                // Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Tanpa Laminasi']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Doff (Matte Halus)']] = ['price' => 2000];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Glossy (Mengkilap)']] = ['price' => 2000];
            }
            // 9. Produk Lainnya (Default Printing Attributes)
            else {
                // Bahan
                $syncData[$attributeValueModelMap['Bahan']['Art Paper 150gr']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Bahan']['Art Carton 260gr']] = ['price' => 5000];

                // Finishing
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Tanpa Laminasi']] = ['price' => 0];
                $syncData[$attributeValueModelMap['Finishing / Laminasi']['Laminasi Doff (Matte Halus)']] = ['price' => 3000];
            }

            // Sync pivot table product_attribute_value
            $product->attributeValues()->sync($syncData);
        }

        $this->command->info('Berhasil men-seed varian (Bahan, Ukuran, Finishing) untuk seluruh ' . $products->count() . ' produk!');
    }
}
