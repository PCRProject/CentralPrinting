# 💎 Panduan Proyek Gemini (Versi Diperpanjang)

Dokumen ini adalah panduan komprehensif yang berfungsi sebagai **sumber kebenaran tunggal** untuk memahami arsitektur, tumpukan teknologi, konvensi, dan alur kerja pengembangan proyek Gemini.

---

## 1. Filosofi & Konsep Utama: Scaffolding Berbasis Stub

> DNA dari proyek ini adalah metodologi **Scaffolding Berbasis Stub**. Ini bukan sekadar fitur, melainkan fondasi alur kerja kita. Alih-alih membuat file secara manual, kita **wajib** menggunakan perintah `php artisan make:feature {NamaFitur}`.

Perintah ini secara otomatis menghasilkan seluruh kerangka fitur—mulai dari Model dan Controller di backend hingga file View React di frontend—berdasarkan *template* yang tersimpan di direktori `stubs/feature`.

**Tujuan utama metodologi ini adalah:**
1.  **Kecepatan Pengembangan:** Mengeliminasi pekerjaan repetitif dan mempercepat inisiasi fitur baru secara drastis.
2.  **Konsistensi Kode:** Memastikan semua fitur memiliki struktur direktori, penamaan file, dan boilerplate kode yang seragam.
3.  **Mengurangi Kesalahan:** Mencegah kesalahan manusiawi yang sering terjadi saat melakukan setup manual.

Aplikasi ini adalah web *full-stack* dengan **Laravel** di backend dan **React** (via **Inertia.js**) di frontend, dirancang sebagai fondasi yang kuat dan dapat diskalakan untuk aplikasi e-commerce atau sistem manajemen konten yang kompleks.

---

## 2. Tumpukan Teknologi (Tech Stack)

Setiap teknologi dipilih untuk perannya yang spesifik dalam menciptakan alur kerja yang mulus antara backend dan frontend.

-   **Backend**:
    -   **PHP 8.2+ & Laravel 12**: Fondasi backend yang kuat, menyediakan fitur-fitur modern seperti routing, ORM (Eloquent), dan sistem antrian.
    -   **Pest**: Framework testing PHP yang elegan dan berfokus pada kesederhanaan untuk pengujian fitur (Feature) dan unit (Unit).

-   **Frontend**:
    -   **React 19 & TypeScript**: Membangun antarmuka pengguna yang interaktif, dinamis, dan *type-safe*, mengurangi bug saat runtime.
    -   **Vite**: Alat build frontend generasi baru yang sangat cepat, memberikan pengalaman pengembangan yang luar biasa dengan Hot Module Replacement (HMR).
    -   **Tailwind CSS 4**: Framework CSS utility-first untuk mendesain antarmuka kustom dengan cepat tanpa meninggalkan HTML.

-   **Jembatan Backend-Frontend**:
    -   **Inertia.js**: "Lem" ajaib yang menghubungkan backend Laravel dengan frontend React. Memungkinkan kita membangun aplikasi halaman tunggal (SPA) modern tanpa perlu membuat API terpisah. Data dilewatkan dari Controller Laravel langsung sebagai *props* ke komponen React.
    -   **Ziggy**: Memungkinkan penggunaan nama rute Laravel (misalnya, `route('products.show')`) langsung di dalam kode JavaScript/React, menjaga konsistensi antara backend dan frontend.

-   **Komponen UI & Desain**:
    -   **Shadcn/UI**: Kumpulan komponen UI yang dapat digunakan kembali, indah, dan aksesibel, dibangun di atas Radix UI dan Tailwind CSS. Komponen-komponen ini (seperti `Button`, `Card`, `Dialog`) dapat kita kustomisasi sepenuhnya.
    -   **Radix UI**: Pustaka komponen UI *headless* tingkat rendah yang menyediakan fungsionalitas dan aksesibilitas, sementara kita menangani styling-nya.
    -   **Lucide Icons**: Pustaka ikon yang bersih, konsisten, dan mudah digunakan.

-   **Tools & Lingkungan**:
    -   **Composer**: Manajer dependensi untuk PHP.
    -   **NPM**: Manajer dependensi untuk JavaScript.
    -   **ESLint & Prettier**: Menjaga kualitas dan konsistensi gaya penulisan kode di seluruh proyek. Dikonfigurasi di `eslint.config.js` dan `.prettierrc`.

---

## 3. Arsitektur & Alur Kerja Inti

Proyek ini mengadopsi **Arsitektur Berbasis Fitur (Feature-Based Architecture)** yang dimodifikasi, di mana logika bisnis utama diisolasi ke dalam modul-modul fitur yang independen.

#### a. Struktur Direktori Kunci & Perannya

-   `app/Features/{NamaFitur}`: **Pusat Logika Bisnis Backend**. Setiap direktori di sini mewakili satu fitur utama aplikasi (misalnya, `Product`, `Order`). Di dalamnya terdapat:
    -   `{NamaFitur}.php`: Model Eloquent untuk fitur tersebut.
    -   `{NamaFitur}Controller.php`: Controller yang menangani permintaan HTTP, logika bisnis, dan merender halaman React melalui Inertia.

-   `routes/features/{nama_fitur}.php`: **Rute Khusus Fitur**. Setiap fitur memiliki file rutenya sendiri. File-file ini secara otomatis dimuat oleh aplikasi (dikonfigurasi di `bootstrap/app.php`), sehingga kita tidak perlu mendaftarkannya secara manual.

-   `resources/js/Pages/Features/{NamaFitur}`: **Komponen Halaman React**. Struktur di sini mencerminkan `app/Features`. Setiap Controller di backend akan merender komponen halaman dari direktori ini. Contoh: `ProductController@show` akan merender `resources/js/Pages/Features/Product/Show.tsx`.

-   `stubs/feature`: **Cetak Biru Proyek**. Ini adalah direktori paling penting untuk metodologi kita. Berisi semua *template* file (`.stub`) yang digunakan oleh perintah `make:feature`. Jika kita ingin mengubah struktur default dari fitur yang baru dibuat, kita memodifikasi file di sini.

#### b. Alur Kerja Pengembangan Fitur Baru (Contoh: Fitur "Ulasan")

Berikut adalah langkah-langkah konkret untuk membuat fitur baru dari awal hingga akhir:

1.  **Scaffolding (Perancah)**: Jalankan perintah inti kita.
    ```bash
    php artisan make:feature Review
    ```
    Perintah ini akan secara otomatis membuat file-file berikut:
    -   `app/Features/Review/Review.php` (Model)
    -   `app/Features/Review/ReviewController.php` (Controller)
    -   `database/migrations/xxxx_xx_xx_xxxxxx_create_reviews_table.php` (Migrasi)
    -   `routes/features/review.php` (File Rute)
    -   `resources/js/Pages/Features/Review/Index.tsx` (Halaman Daftar)
    -   `resources/js/Pages/Features/Review/FormPage.tsx` (Halaman Buat/Edit)

2.  **Backend - Database & Model**:
    -   Buka file migrasi yang baru dibuat, definisikan skema tabel `reviews` (misalnya, `product_id`, `user_id`, `rating`, `comment`).
    -   Jalankan migrasi: `php artisan migrate`.
    -   Buka model `Review.php`, definisikan relasi (misalnya, `belongsTo(Product::class)`).

3.  **Backend - Controller & Rute**:
    -   Buka `ReviewController.php`. Isi logika untuk metode `index`, `store`, `update`, `destroy`.
    -   Contoh di `index()`: `return inertia('Features/Review/Index', ['reviews' => Review::all()]);`
    -   Buka `routes/features/review.php` dan definisikan rute yang diperlukan, misalnya `Route::resource('reviews', ReviewController::class);`.

4.  **Frontend - Halaman React**:
    -   Buka `Index.tsx`. Gunakan *props* `reviews` yang dikirim dari controller untuk menampilkan daftar ulasan.
    -   Buka `FormPage.tsx`. Buat formulir untuk mengirim ulasan baru menggunakan hook `useForm` dari Inertia.

5.  **Verifikasi**: Jalankan server (`composer dev`) dan akses rute yang baru Anda buat untuk memastikan semuanya berfungsi.

---

## 4. Sistem & Konvensi Penting Lainnya

-   **Routing & Ziggy**: Semua rute fitur dimuat dari `routes/features`. Setelah menambahkan rute baru, jalankan `php artisan ziggy:generate` agar Ziggy dapat mengenali rute tersebut di frontend. Ini sangat penting untuk menghindari error `route '...' is not in the route list`.

-   **Manajemen State Frontend**: Sebagian besar manajemen state ditangani oleh Inertia. Untuk formulir, kita menggunakan hook `useForm` yang disediakan Inertia. Untuk state global (seperti data keranjang), kita membagikannya dari Laravel melalui middleware `HandleInertiaRequests.php`.

-   **Komponen UI**: Komponen UI umum (yang tidak spesifik untuk satu halaman) ditempatkan di `resources/js/components`. Kita sangat menganjurkan penggunaan kembali komponen dari `shadcn/ui` untuk menjaga konsistensi visual.

-   **Styling**: Proyek ini menggunakan Tailwind CSS. Semua styling harus dilakukan menggunakan kelas utilitas langsung di dalam komponen `.tsx`. CSS global hanya ada di `resources/css/app.css` untuk beberapa pengaturan dasar.

-   **Autentikasi & Otorisasi**: Sistem autentikasi menggunakan Laravel Breeze/Fortify sebagai dasarnya. Otorisasi berbasis peran diimplementasikan melalui `RoleMiddleware.php`. Peran pengguna (misalnya, `admin`, `customer`) didefinisikan di model `User`.

---

## 5. Branding & Aset Visual

Bagian ini mendefinisikan aset visual dan standar branding untuk menjaga konsistensi di seluruh aplikasi.

-   **Logo Utama**:
    -   **Lokasi File**: `storage/app/public/logo/logo.png`
    -   **URL Publik**: Logo harus selalu diakses melalui path `/storage/logo/logo.png`.
    -   **Penggunaan**: Gunakan logo ini di header utama, halaman login, checkout, dan semua titik branding utama lainnya.

-   **Palet Warna Resmi**:
    -   **Primer (Aksi Utama)**: `Oranye (#FF6500)`. Digunakan untuk tombol utama (CTA), tautan penting, ikon aktif, dan elemen yang membutuhkan perhatian pengguna.
    -   **Teks & Elemen UI**: `Abu-abu Tua (#1F2937)`. Digunakan untuk sebagian besar teks, judul, dan ikon standar untuk memastikan keterbacaan yang optimal.
    -   **Latar Belakang & Aksen**: `Abu-abu Sangat Terang (#F9FAFB)` atau `Putih (#FFFFFF)`. Digunakan sebagai warna latar belakang utama halaman dan kartu untuk memberikan tampilan yang bersih dan modern.

---

## 5. Panduan Setup Cepat

1.  **Instalasi Dependensi:**
    ```bash
    composer install
    npm install
    ```

2.  **Konfigurasi Lingkungan:**
    -   Salin `.env.example` ke `.env`.
    -   Jalankan `php artisan key:generate`.
    -   Sesuaikan koneksi database di `.env`.

3.  **Setup Database & Data Awal:**
    ```bash
    php artisan migrate --seed
    ```

4.  **Generate File Ziggy:**
    ```bash
    php artisan ziggy:generate
    ```

5.  **Jalankan Server Pengembangan:**
    ```bash
    composer dev
    ```
    Perintah `dev` adalah alias yang menjalankan `php artisan serve` dan `npm run dev` secara bersamaan. Aplikasi kini dapat diakses di `http://127.0.0.1:8000`.

---

## 6. Alur Kerja Pembaruan Changelog (Semi-Otomatis)

Proyek ini menggunakan alur kerja semi-otomatis untuk mencatat perkembangan.

1.  **Pengembang (Anda):** Selesaikan pekerjaan dan lakukan `git commit` dengan pesan yang jelas dan deskriptif.
2.  **Asisten AI (Gemini):** Berikan perintah **"Tolong perbarui changelog"**. Asisten akan menganalisis *commit* terakhir, membuat draf entri, dan meminta persetujuan Anda sebelum menambahkannya ke dokumen ini.

---

## Riwayat Perubahan

*(Entri baru akan ditambahkan di sini oleh Asisten AI)*

### 15 Oktober 2026
- **Fitur Baru: Pembuatan Pesanan Manual (POS / Kasir Walk-in & WhatsApp), Nota Transaksi, dan Kalender Produksi Admin**
    -   **Database:** Membuat migrasi tabel `orders` untuk mendukung status order fleksibel (`order_status` varchar), alamat pengiriman opsional untuk pickup/walk-in (`shipping_address` nullable), dan kolom sumber pesanan (`order_source`).
    -   **Backend (Model):** Memperbarui model `Order` dengan field `$fillable` `order_source`.
    -   **Backend (Routing & Controller):**
        -   Memperbarui `OrderController@create` dan `store` dengan deteksi role admin (`createAdmin` & `storeAdmin`).
        -   Menyediakan data seluruh produk aktif beserta varian bahan/ukuran dan data pelanggan untuk admin.
        -   Menangani pembuatan pelanggan baru instan (*walk-in* / nomor WhatsApp), upload file desain pelanggan langsung ke `storage/app/public/designs/`, kalkulasi harga dinamis, target selesai pengerjaan (`estimated_completion_date`), dan catatan admin (`admin_notes`).
        -   Menambahkan rute dan controller method `/orders/{order}/invoice` untuk cetak nota resmi.
        -   Menambahkan rute dan controller method `/orders/calendar` untuk kalender jadwal pengerjaan.
    -   **Frontend (Form Pembuatan Pesanan Admin):** Membangun form lengkap pada `Order/FormPage.tsx` dengan pemilihan/pembuatan pelanggan instan, multi-item produk, seleksi varian bahan & kalkulasi harga realtime, unggah file desain atau pilih template, penentuan tanggal deadline pengerjaan, dan ringkasan pembayaran.
    -   **Frontend (Cetak Nota Resmi):** Membangun komponen `Order/Invoice.tsx` dengan branding resmi Central Printing, nomor nota unik, tanggal order & deadline pengerjaan, tabel rincian bahan/ukuran, status stempel lunas/belum lunas, catatan operator, ketentuan pengambilan, dan optimasi `@media print` untuk cetak langsung ke printer atau simpan PDF.
    -   **Frontend (Kalender Jadwal Pengerjaan):** Membangun komponen `Order/Calendar.tsx` dengan tampilan kalender bulanan interaktif, penanda deadline pengerjaan, indikator warna status, sidebar antrian prioritas deadline hari ini, dan modal quick-update status pengerjaan.
    -   **Frontend (Navigasi & Header):** Menambahkan menu "Jadwal Pengerjaan" di sidebar admin (`navigation.ts`), tombol "Buat Pesanan Baru" dan "Jadwal Pengerjaan" di header daftar pesanan (`Order/Index.tsx`), serta tombol "Cetak Nota" di setiap baris aksi dan detail pesanan (`Order/Show.tsx`).

- **Fitur Baru: Sistem Saklar Fitur Dinamis (Dynamic Feature Flags) di Pengaturan Admin**
    -   **Database:** Membuat migrasi tabel `app_settings` untuk menyimpan status switch aktif/nonaktif setiap modul sistem (`customer_portal`, `orders`, `products`, `customers`, `reviews`, `stores`).
    -   **Backend (Model & Cache):** Membuat model `AppSetting` dengan caching otomatis untuk pengecekan cepat `AppSetting::isEnabled()`.
    -   **Backend (Middleware):** Membuat middleware `CheckFeatureEnabled` (`feature:{key}`) yang mencegat dan mengalihkan akses rute jika suatu fitur dinonaktifkan.
    -   **Backend (Inertia Global Props):** Membagikan status semua fitur secara realtime ke seluruh halaman frontend melalui `HandleInertiaRequests`.
    -   **Backend (Routing & Controller):** Menambahkan `FeatureSettingController` dan rute `/settings/features` khusus admin untuk memodifikasi status fitur.
    -   **Frontend (Pengaturan Admin):** Menambahkan halaman `/settings/features` dengan komponen Shadcn Card, Badge, dan Switch interaktif, lengkap dengan notifikasi toast.
    -   **Frontend (Sidebar & Navigasi):** Memperbarui `AppSidebar` dan `navigation.ts` agar otomatis menyembunyikan atau menampilkan item menu (Pesanan, Produk, Pelanggan, Ulasan, Lokasi Toko) sesuai status saklar di pengaturan.
    -   **Frontend (Login Adaptif):** Menyesuaikan halaman login agar otomatis berganti antara mode umum dan portal admin sesuai status saklar `customer_portal`.

- **Pengaturan: Menonaktifkan Fitur Pelanggan & Fokus Portal Admin**
    -   **Backend (Routing):** Mengalihkan rute utama (`/`) ke login atau dashboard admin. Menutup registrasi pelanggan baru dengan mengarahkan `register` ke `login`.
    -   **Backend (Otorisasi):** Membatasi rute keranjang belanja (`cart.*`), toko (`shop.index`), portofolio, detail produk (`products.show`), dan pesanan/checkout (`purchase`) khusus peran admin (`role:admin`).
    -   **Backend (Autentikasi):** Menolak login akun non-admin pada `AuthenticatedSessionController` dengan pesan peringatan pemeliharaan sistem.
    -   **Frontend:** Memperbarui antarmuka login menjadi Portal Administrator dan menyembunyikan tautan pendaftaran pelanggan.


### 19 Oktober 2025
- **Perbaikan: Crash Halaman Daftar Pesanan Admin**
    -   **Masalah:** Halaman daftar pesanan (`/orders`) di panel admin mengalami *crash* dengan *error* JavaScript `TypeError: Cannot read properties of undefined (reading 'data')`.
    -   **Akar Masalah:** Terjadi ketidaksesuaian nama *prop* data antara backend dan frontend. `OrderController` mengirimkan data pesanan dalam variabel `orders`, sementara komponen React `Order/Index.tsx` mengharapkan variabel tersebut bernama `items` setelah refaktor sebelumnya untuk konsistensi.
    -   **Perbaikan (Backend):** Memperbarui metode `index` di `OrderController.php` untuk mengubah nama kunci dari `orders` menjadi `items` saat mengirim data ke Inertia. Perubahan ini menyelaraskan controller dengan ekspektasi komponen frontend dan berhasil mengatasi *error*.

### 10 Oktober 2025
- **Peningkatan (UI/UX): Desain Ulang Total Halaman Checkout**
    -   **Fitur (Frontend):** Mengimplementasikan *header* minimalis pada halaman *checkout* untuk mengurangi distraksi dan menjaga fokus pengguna pada proses transaksi.
    -   **Fitur (Frontend):** Menambahkan komponen *accordion* untuk ringkasan pesanan pada tampilan *mobile*, memastikan informasi penting seperti total harga selalu terlihat tanpa perlu *scroll*.
    -   **UI/UX (Frontend):** Menyempurnakan formulir alamat dengan *placeholder* yang informatif dan menambahkan opsi "Simpan alamat" untuk transaksi di masa depan.
    -   **UI/UX (Frontend):** Mengganti teks "Segera Hadir" pada metode pembayaran dengan visualisasi ikon metode pembayaran (Kartu Kredit, Transfer Bank, dll.) dalam keadaan nonaktif, memberikan gambaran yang lebih profesional.
    -   **UI/UX (Frontend):** Menambahkan tautan "Ubah" pada langkah konfirmasi, memungkinkan pengguna untuk kembali dan mengoreksi alamat atau metode pembayaran dengan mudah.
    -   **Peningkatan (Frontend):** Meningkatkan kepercayaan pengguna dengan menambahkan ikon gembok "Transaksi Aman" dan menampilkan detail varian produk di ringkasan pesanan.
    -   **Peningkatan (Frontend):** Menambahkan ikon *spinner* pada tombol "Buat Pesanan" untuk memberikan umpan balik visual yang lebih jelas saat proses sedang berjalan.

### 9 Oktober 2025
- **Perbaikan Kritis: Fungsionalitas Edit Desain di Keranjang**
    -   **Backend:** Mengimplementasikan logika di `CartController` untuk secara otomatis mendeteksi dan menghapus file desain kustom lama dari server saat pelanggan menggantinya dengan template atau unggahan baru di dalam keranjang. Ini mencegah penumpukan file yatim piatu di storage.
    -   **Frontend:** Mengatasi bug di modal edit (`ProductQuickView.tsx`) di mana template desain yang sudah dipilih tidak ditampilkan kembali dengan benar. Masalah ini disebabkan oleh perbandingan tipe data yang tidak cocok (`string` vs `number`) dan telah diperbaiki.
- **Peningkatan (UI/UX): Logika & Tampilan Ikon Keranjang**
    -   **Perbaikan (Frontend):** Memperbaiki logika penghitungan pada ikon keranjang (`CartSheet.tsx`). Angka pada ikon sekarang secara akurat menampilkan jumlah *item unik*, bukan total kuantitas produk, sesuai dengan perilaku yang diharapkan.
    -   **Refactor (Frontend):** Menyederhanakan antarmuka keranjang dengan menghapus tombol tambah/kurang kuantitas. Pelanggan kini dapat mengubah kuantitas melalui alur "Edit" yang lebih jelas.
- **Peningkatan (UI/UX): Desain Ulang Total Komponen Keranjang Belanja**
    -   **Frontend:** Merombak total `CartSheet.tsx` dengan antarmuka yang lebih modern, rapi, dan *user-friendly*.
    -   **UI/UX (Frontend):** Memperbaiki tata letak kartu item untuk hierarki visual yang lebih baik, menambahkan garis pemisah antar item, dan menyempurnakan desain *header* serta *footer* untuk pengalaman pengguna yang lebih profesional.

### 8 Oktober 2025
- **Fitur: Fungsionalitas Penuh Keranjang Belanja**
    -   **Backend:** Mengimplementasikan logika `CartController` untuk menambah (`store`), memperbarui (`update`), dan menghapus (`destroy`) item dari keranjang belanja berbasis sesi. Mendaftarkan rute `POST`, `PATCH`, dan `DELETE` yang sesuai.
    -   **Backend:** Memperbarui middleware `HandleInertiaRequests` untuk membagikan data keranjang secara global ke semua komponen frontend.
    -   **Frontend:** Menghubungkan tombol "Tambah ke Keranjang" di halaman detail produk (`Product/Show.tsx`) untuk mengirim data ke backend menggunakan `useForm` dari Inertia.
    -   **Perbaikan (Backend):** Mengatasi *error* SQL `Unknown column 'id'` dengan memperbaiki aturan validasi dan logika pencarian produk di `CartController` agar menggunakan `id_produk` sebagai *primary key*.
- **Peningkatan (UI/UX): Desain Ulang Total Komponen Keranjang Belanja**
    -   **Frontend:** Merombak total `CartSheet.tsx` dengan antarmuka yang lebih modern dan *user-friendly*, sesuai dengan referensi desain.
    -   **Fitur (Frontend):** Mengimplementasikan *quantity stepper* (+/-) dan tombol hapus yang fungsional untuk setiap item di keranjang, yang berinteraksi dengan backend secara *real-time* tanpa me-reload halaman.
    -   **UI/UX (Frontend):** Mendesain ulang tampilan saat keranjang kosong dan menyempurnakan bagian *footer* dengan tombol "Checkout" dan "Lanjutkan Belanja" yang lebih jelas.

### 5 Oktober 2025
- **Perbaikan Kritis: Routing Admin & Stabilitas Halaman Detail Produk**
    -   **Masalah:** Ditemukan error `Route [dashboard] not defined` saat admin login. Meskipun komponen `dashboard.tsx` ada, tidak ada rute backend yang terhubung dengannya.
    -   **Perbaikan (Backend):** Menambahkan rute `/dashboard` baru di `routes/web.php` dengan nama `dashboard`. Rute ini dilindungi oleh *middleware* `auth` dan `role:admin`, dan secara spesifik merender komponen Inertia `dashboard`.
    -   **Perbaikan (Backend):** Memastikan logika di `AuthenticatedSessionController@store` mengarahkan admin ke `route('dashboard')` setelah login.
    -   **Perbaikan (Frontend):** Memastikan semua referensi ke dasbor di antarmuka pengguna, seperti item menu navigasi (`lib/navigation.ts`) dan tautan logo (`components/app-header.tsx`), menunjuk ke rute `dashboard` yang baru dibuat.
    -   **Catatan Tambahan:** Perbaikan ini mengoreksi upaya sebelumnya yang salah mengarahkan admin ke halaman `products.index`.
- **Perbaikan: Masalah Rute Ziggy & Pendaftaran Rute Fitur**
    -   **Masalah:** Setelah login, admin terjak di halaman login karena error JavaScript `Ziggy error: route 'products.index' is not in the route list`.
    -   **Akar Masalah:** Sistem routing Laravel di `bootstrap/app.php` tidak secara otomatis memuat file rute yang berada di dalam subdirektori `routes/features`, sehingga rute-rute tersebut tidak diketahui oleh Ziggy.
    -   **Perbaikan (Backend):** Memodifikasi `bootstrap/app.php` untuk secara dinamis memindai dan mendaftarkan semua file rute dari direktori `routes/features`.
    -   **Perbaikan (Infrastruktur):** Menjalankan `php artisan route:clear` dan `php artisan ziggy:generate` untuk membersihkan cache lama dan membuat ulang file `ziggy.js` dengan daftar rute yang lengkap.

### 4 Oktober 2025
- **Fitur: Saklar Utama Osi Desain & Peningkatan UI/UX**
    -   **Backend:** Mengimplementasikan fondasi untuk saklar utama fitur desain.
        -   Menambahkan kolom boolean `enable_design_feature` ke tabel `products` melalui migrasi database baru.
        -   Memperbarui model `Product.php` dengan menambahkan `enable_design_feature` ke properti `$fillable` dan `$casts` untuk mass-assignment dan penjaminan tipe data.
        -   Menambahkan aturan validasi `required|boolean` untuk field baru di dalam `ProductController.php`.
    -   **Frontend (Panel Admin):** Membangun antarmuka untuk saklar utama pada `Product/FormPage.tsx`.
        -   Menambahkan komponen `Switch` baru yang terikat pada state `data.enable_design_feature`.
        -   Membungkus seluruh opsi desain lainnya (izin unggah kustom, area unggah templat) dalam blok render kondisional yang hanya tampil jika saklar utama aktif.
    -   **Frontend (Halaman Pelanggan):** Mengintegrasikan logika saklar utama pada `Product/Show.tsx`.
        -   Fungsi `renderDesignOptions()` kini mengembalikan `null` (tidak merender apapun) jika `product.enable_design_feature` bernilai `false`.
        -   Logika variabel `isDesignSelected` diperbarui agar selalu `true` (mengabaikan validasi desain) saat fitur dinaktifkan, sehingga tombol "Tambah ke Keranjang" dapat berfungsi.
        -   Pesan pada `Tooltip` juga disesuaikan agar tidak lagi meminta pelanggan memilih desain jika fiturnya memang tidak aktif untuk produk tersebut.
- **Peningkatan (UI/UX): Komponen Input Jumlah Produk (*Quantity Stepper*)**
    -   **Refactor (Frontend):** Merombak total komponen input jumlah pada `Product/Show.tsx` untuk pengalaman pengguna yang superior.
        -   Mengganti input jumlah standar dengan komponen *stepper* kustom yang terintegrasi secara visual, di mana tombol `-`, input angka, dan tombol `+` digabungkan menjadi satu blok yang solid dan elegan.
        -   Memperbarui *state management* untuk `quantity` agar dapat menangani input kosong sementara (`string | number`) saat pengguna mengetik.
        -   Mengimplementasikan *event handler* `onBlur` yang cerdas, yang akan otomatis mengembalikan nilai ke `1` jika input ditinggalkan dalam keadaan kosong atau tidak valid.
        -   Menambahkan validasi `onChange` untuk hanya memperbolehkan input numerik.

### 4 Oktober 2025
- **Fitur (Backend):** Mengimplementasikan fondasi backend untuk fitur "Opsi Desain" produk, termasuk migrasi, model, dan relasi.
- **Fitur (Backend):** Menambahkan logika lengkap pada `DesignTemplateController` untuk mengelola siklus hidup *template* desain (CRUD, unggah file, dll).
- **Fitur (Admin):** Memperbarui formulir produk (`Product/FormPage.tsx`) dengan `Switch` untuk "Izinkan Desain Kustom" dan `Checkbox` untuk menautkan *template* desain.
- **Refactor (Backend):** Memperbarui `ProductController` untuk menangani penyimpanan dan sinkronisasi relasi *template* desain.
- **Backend:** Memperbarui `ProductController@show` untuk memuat data `designTemplates` terkait di halaman detail produk.

### 4 Oktober 2025
- **Refactor (Frontend):** Merombak total logika halaman detail produk (`Product/Show.tsx`) untuk sistem pemilihan varian yang interaktif dan efisien.
- **Fitur (Frontend):** Mengimplementasikan sistem pemilihan atribut/varian yang wajib; tombol "Tambah ke Keranjang" dinonaktifkan hingga semua opsi dipilih.
- **Fitur (Frontend):** Harga total produk kini diperbarui secara dinamis berdasarkan harga dasar, varian, dan kuantitas.
- **UI/UX (Frontend):** Menambahkan `Tooltip` untuk memberikan umpan balik yang jelas saat tombol "Tambah ke Keranjang" nonaktif.
- **Perbaikan (Frontend):** Mengatasi *crash* pada halaman detail produk dengan menginstal dan mengonfigurasi komponen `RadioGroup` yang hilang.
- **Perbaikan (Kode):** Memperbaiki kesalahan penulisan `import` React.

### 4 Oktober 2025
- **Perbaikan (Backend):** Mengatasi masalah "reload ganda" di seluruh aplikasi dengan menyimpan data `quote` di dalam sesi.
- **Perbaikan (Frontend):** Memperbaiki bug paginasi di halaman produk admin yang selalu kembali ke halaman pertama.

### 4 Oktober 2025
- **Fitur:** Mengimplementasikan halaman detail produk dan fungsionalitas pembaruan produk untuk admin.
- **Backend:** Membuat *route* dan *method controller* yang diperlukan untuk menampilkan dan memperbarui produk.
- **Frontend:** Membangun komponen React baru untuk halaman detail produk.

### 4 Oktober 2025
- **Fitur:** Mengimplementasikan selektor atribut interaktif pada halaman detail produk.
- **Frontend:** Harga produk di halaman detail kini diperbarui secara dinamis berdasarkan pilihan atribut dan kuantitas.
- **Perbaikan (Backend):** Memperbaiki error 404 pada halaman "Tambah/Edit Produk" dengan mengatur ulang prioritas rute.
- **Perbaikan (Backend):** Mengatasi error SQL saat menyimpan produk baru dengan memperbaiki properti `$fillable` di model `Product`.

### 4 Oktober 2025
- **Refactor:** Merombak total halaman detail produk (`Product/Show.tsx`) untuk meningkatkan UI/UX dan kualitas visual.
- **Fitur:** Mengganti notifikasi `Toast` standar dengan `Sonner` untuk umpan balik yang lebih modern.
- **Perbaikan:** Memperbaiki navigasi ke halaman detail produk untuk menggunakan `slug` bukan `ID`.
- **Perbaikan:** Mengatasi masalah "halaman putih" dengan membuat komponen React lebih tangguh terhadap data yang hilang.
- **Chore:** Menambahkan komponen UI (`Separator`, `Sonner`) yang diperlukan dari `shadcn/ui`.

### 2 Oktober 2025
- **Fitur:** Mengganti URL produk dari berbasis ID menjadi berbasis `slug` untuk meningkatkan SEO.
-   **Fitur:** Detail produk pada halaman detail kini menampilkan data dinamis dari database.
-   **UI/UX:** Menyederhanakan halaman detail produk dengan menghapus galeri thumbnail.
-   **Backend:** Menambahkan kolom `slug`, memperbarui model `Product` untuk membuat `slug` otomatis, dan membuat *command* Artisan untuk mengisi `slug` pada data lama.
-   **Frontend:** Memperbarui semua tautan produk untuk menggunakan `slug`.

### 2 Oktober 2025
- **Fitur:** Mengimplementasikan halaman detail produk untuk pelanggan.
- **Backend:** Menambahkan *route* dan *method controller* `products.show`.
- **Frontend:** Membuat komponen React baru (`Product/Show.tsx`) dan mendesain tata letaknya.
- **Perbaikan:** Memperbaiki masalah tata letak yang keliru menampilkan *sidebar* admin di halaman detail produk.

### 2 Oktober 2025
- **Refactor:** Mendesain ulang kartu produk pada halaman utama (`CollectionSection.tsx`).
- **UI/UX:** Gambar dan nama produk kini menjadi satu tautan; tombol "Lihat Detail" dihapus; tombol "Add to Cart" dipindahkan.

### 2 Oktober 2025
- **Dokumentasi:** Memperbarui `GEMINI.md` dengan alur kerja baru untuk pencatatan changelog semi-otomatis.
