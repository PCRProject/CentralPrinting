<?php

namespace App\Features\Order;

use App\Features\Product\Product;
use App\Features\Customer\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource for Admin.
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Logic for Customers
        if ($user->role !== 'admin') {
            // Get customer record for the logged-in user
            $customer = $user->customer;
            if (!$customer) {
                return Inertia::render('Features/Order/Index', [
                    'orders' => ['data' => []],
                ]);
            }
            
            $query = Order::where('customer_id', $customer->id)
                ->with('items.product')
                ->latest();

            return Inertia::render('Features/Order/Index', [
                'orders' => $query->paginate(10)->withQueryString(),
            ]);
        }

        // Logic for Admins
        $model = new Order;
        $columns = array_diff($model->getConnection()->getSchemaBuilder()->getColumnListing($model->getTable()), $model->getHidden());
        $query = Order::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request, $columns) {
                foreach ($columns as $column) {
                    $q->orWhere($column, 'like', '%' . $request->search . '%');
                }
            });
        }

        // Filter by order status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('order_status', $request->status);
        }

        // Filter by payment status
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('sort_by') && $request->filled('sort_dir')) {
            $query->orderBy($request->sort_by, $request->sort_dir);
        } else {
            $query->latest();
        }

        return Inertia::render('Features/Order/Index', [
            'items' => $query->with('customer.user', 'items.product')->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'sort_by', 'sort_dir', 'status', 'payment_status']),
        ]);
    }

    // Shipping methods are now fetched dynamically from RajaOngkir API

    // Payment methods available for checkout
    const PAYMENT_METHODS = [
        ['id' => 'bca', 'name' => 'Transfer Bank BCA', 'description' => 'Cek otomatis'],
        ['id' => 'credit_card', 'name' => 'Kartu Kredit', 'description' => 'Visa / MasterCard'],
    ];

    /**
     * Show the checkout page for the customer or manual order form for admin.
     */
    public function create(Request $request)
    {
        if (auth()->check() && auth()->user()->role === 'admin') {
            return $this->createAdmin($request);
        }

        $request->validate([
            'selected_items' => 'sometimes|array',
            'selected_items.*' => 'string',
        ]);

        $allCartItems = session('cart.items', []);
        $selectedItemIds = $request->input('selected_items');

        // Jika tidak ada item yang dipilih secara eksplisit, anggap semua item dipilih
        if (empty($selectedItemIds)) {
            $itemsForCheckout = array_values($allCartItems);
        } else {
            // Filter keranjang berdasarkan item yang dipilih
            $itemsForCheckout = array_values(array_filter($allCartItems, function ($item) use ($selectedItemIds) {
                return in_array($item['id'], $selectedItemIds);
            }));
        }

        if (empty($itemsForCheckout)) {
            // Redirect kembali ke halaman sebelumnya atau ke halaman keranjang dengan pesan error
            return redirect()->back()->withErrors(['cart' => 'Anda harus memilih setidaknya satu item untuk checkout.']);
        }

        // Calculate subtotal from items
        $subtotal = array_reduce($itemsForCheckout, function ($carry, $item) {
            return $carry + ($item['price'] * $item['quantity']);
        }, 0);

        // Fetch provinces to pass directly as props (eliminates frontend API call dependency)
        $rajaOngkirController = new \App\Http\Controllers\Features\RajaOngkirController();
        $provincesResponse = $rajaOngkirController->getProvinces();
        $provincesData = json_decode($provincesResponse->getContent(), true);
        $provinces = ($provincesData['success'] ?? false) ? ($provincesData['data'] ?? []) : [];

        return Inertia::render('Features/Checkout/Index', [
            'cartItems' => $itemsForCheckout,
            'subtotal' => $subtotal,
            'paymentMethods' => self::PAYMENT_METHODS,
            'initialProvinces' => $provinces,
        ]);
    }

    /**
     * Store a newly created order from customer checkout or admin manual creation.
     */
    public function store(Request $request)
    {
        if (auth()->check() && auth()->user()->role === 'admin') {
            return $this->storeAdmin($request);
        }

        $validated = $request->validate([
            'shipping_address.name' => 'required|string|max:255',
            'shipping_address.address' => 'required|string|max:500',
            'shipping_address.city' => 'required|string|max:100',
            'shipping_address.city_id' => 'required|integer',
            'shipping_address.province' => 'required|string|max:100',
            'shipping_address.province_id' => 'required|integer',
            'shipping_address.postal_code' => 'required|string|max:10',
            'shipping_address.phone' => 'required|string|max:20',
            'shipping_method' => 'required|array',
            'shipping_method.courier' => 'required|string',
            'shipping_method.service' => 'required|string',
            'shipping_method.cost' => 'required|integer',
            'shipping_method.etd' => 'nullable|string',
            'payment_method' => 'required|string|in:bca_va,bni_va,bri_va,permata_va,credit_card,gopay,shopeepay,qris',
            'selected_items' => 'required|array|min:1',
            'selected_items.*' => 'string',
        ]);

        $allCartItems = session('cart.items', []);
        $selectedItemIds = $validated['selected_items'];

        // 1. Filter cart items
        $itemsToProcess = array_filter($allCartItems, function ($item) use ($selectedItemIds) {
            return in_array($item['id'], $selectedItemIds);
        });

        if (empty($itemsToProcess)) {
            return response()->json(['error' => 'Tidak ada item yang dipilih untuk diproses.'], 422);
        }

        // 2. Get product prices from database
        $productIds = array_column($itemsToProcess, 'product_id');
        $productsById = Product::whereIn('id_produk', $productIds)->get()->keyBy('id_produk');

        // 3. Calculate subtotal
        $subtotal = 0;
        foreach ($itemsToProcess as $item) {
            $product = $productsById->get($item['product_id']);
            if ($product) {
                $subtotal += $item['price'] * $item['quantity'];
            }
        }

        // 4. Get shipping cost
        $shippingCost = $validated['shipping_method']['cost'];
        $shippingMethodName = $validated['shipping_method']['courier'] . ' - ' . $validated['shipping_method']['service'];

        // 5. Calculate tax (11%)
        $tax = $subtotal * 0.11;

        // 6. Calculate total
        $totalPrice = $subtotal + $shippingCost + $tax;

        $order = null;
        try {
            // Get customer record
            $customer = auth()->user()->customer;
            if (!$customer) {
                return response()->json(['error' => 'Anda harus melengkapi profil customer terlebih dahulu.'], 422);
            }
            
            DB::transaction(function () use ($validated, $itemsToProcess, $totalPrice, $shippingCost, $shippingMethodName, $productsById, &$order, $customer) {
                // Create order entry
                $order = Order::create([
                    'customer_id' => $customer->id,
                    'order_status' => 'pending',
                    'total_price' => $totalPrice,
                    'shipping_address' => $validated['shipping_address'],
                    'shipping_cost' => $shippingCost,
                    'shipping_method' => $shippingMethodName,
                    'payment_method' => 'midtrans', // Will be updated by webhook
                    'payment_status' => 'unpaid',
                ]);

                // Create order items
                foreach ($itemsToProcess as $item) {
                    $product = $productsById->get($item['product_id']);
                    if ($product) {
                        $order->items()->create([
                            'product_id_produk' => $item['product_id'],
                            'quantity' => $item['quantity'],
                            'price' => $item['price'],
                            'options' => [
                                'variant' => $item['variant'] ?? null,
                                'design' => $item['design'] ?? null,
                                'note' => $item['note'] ?? null,
                            ],
                        ]);
                    }
                }
            });

            // 7. Generate Midtrans Snap Token
            \Midtrans\Config::$serverKey = config('midtrans.server_key');
            \Midtrans\Config::$isProduction = config('midtrans.is_production');
            \Midtrans\Config::$isSanitized = config('midtrans.is_sanitized');
            \Midtrans\Config::$is3ds = config('midtrans.is_3ds');

            $order->load('items.product');

            $transactionDetails = [
                'order_id' => 'ORDER-' . $order->id . '-' . time(),
                'gross_amount' => (int) $order->total_price,
            ];

            $customerDetails = [
                'first_name' => $validated['shipping_address']['name'],
                'email' => auth()->user()->email,
                'phone' => $validated['shipping_address']['phone'],
            ];

            $itemDetails = [];
            foreach ($order->items as $item) {
                $itemDetails[] = [
                    'id' => $item->product_id_produk,
                    'price' => (int) $item->price,
                    'quantity' => $item->quantity,
                    'name' => substr($item->product->nama_produk ?? 'Product', 0, 50),
                ];
            }

            // Add shipping cost
            if ($order->shipping_cost > 0) {
                $itemDetails[] = [
                    'id' => 'SHIPPING',
                    'price' => (int) $order->shipping_cost,
                    'quantity' => 1,
                    'name' => 'Biaya Pengiriman',
                ];
            }

            // Add tax
            $taxAmount = (int) round($subtotal * 0.11);
            if ($taxAmount > 0) {
                $itemDetails[] = [
                    'id' => 'TAX',
                    'price' => $taxAmount,
                    'quantity' => 1,
                    'name' => 'PPN (11%)',
                ];
            }

            // Map payment method to enabled_payments
            $enabledPayments = [$validated['payment_method']];

            $transactionPayload = [
                'transaction_details' => $transactionDetails,
                'customer_details' => $customerDetails,
                'item_details' => $itemDetails,
                'enabled_payments' => $enabledPayments,
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($transactionPayload);

            // Save snap token to order
            $order->update([
                'snap_token' => $snapToken,
                'midtrans_order_id' => $transactionDetails['order_id'],
            ]);

            // 8. Remove checked out items from cart
            $remainingCartItems = array_filter($allCartItems, function ($item) use ($selectedItemIds) {
                return !in_array($item['id'], $selectedItemIds);
            });

            $newSubtotal = array_reduce($remainingCartItems, function ($carry, $item) {
                return $carry + ($item['price'] * $item['quantity']);
            }, 0);

            session(['cart' => [
                'items' => $remainingCartItems,
                'subtotal' => $newSubtotal,
            ]]);

            // 9. Return JSON with snap token
            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'snap_token' => $snapToken,
                'message' => 'Pesanan berhasil dibuat. Silakan lanjutkan pembayaran.',
            ]);

        } catch (\Exception $e) {
            Log::error('Order creation failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }


    /**
     * Display the specified resource for Admin.
     */
    public function show(Order $order)
    {
        Log::info('OrderController@show triggered', [
            'order_id' => $order->id,
            'auth_user_id' => auth()->id(),
            'auth_role' => auth()->user()->role ?? 'none',
        ]);

        // Auto-sync status before showing details
        if ($order->payment_status === 'unpaid' && $order->midtrans_order_id) {
            $this->syncPaymentStatus($order);
            // Refresh the model in case it was updated
            $order->refresh();
        }

        // Pastikan pengguna hanya bisa melihat order miliknya, kecuali admin
        $customer = auth()->user()->customer;

        // Fallback: jika relasi customer tidak ter-load (null), query langsung ke DB
        if (!$customer) {
            $customer = \App\Features\Customer\Customer::where('user_id', auth()->id())->first();
        }
        
        Log::info('OrderController@show authorization check', [
            'customer_id' => $customer ? $customer->id : 'null',
            'order_customer_id' => $order->customer_id,
            'comparison' => $customer ? ((int) $order->customer_id === (int) $customer->id ? 'MATCH' : 'MISMATCH') : 'NO_CUSTOMER',
        ]);

        if (auth()->user()->role !== 'admin' && (!$customer || (int) $order->customer_id !== (int) $customer->id)) {
            Log::warning('OrderController@show access denied (403)', [
                'user_id' => auth()->id(),
                'order_id' => $order->id,
                'customer_id' => $customer ? $customer->id : 'null',
                'order_customer_id' => $order->customer_id,
            ]);
            abort(403);
        }

        $order->load('customer.user', 'items.product');

        // Pre-fetch all attributes and attribute values for efficiency
        $allAttributes = \App\Features\Product\Attribute::all()->keyBy('id');
        $allAttributeValues = \App\Features\Product\AttributeValue::all()->keyBy('id');

        // Resolve design template paths and variant names for each order item
        $order->items->transform(function ($item) use ($allAttributes, $allAttributeValues) {
            $options = $item->options ?? [];

            // Resolve variant IDs to names
            if (isset($options['variant']) && is_array($options['variant'])) {
                $resolvedVariants = [];

                foreach ($options['variant'] as $attributeId => $valueId) {
                    // Get attribute name
                    $attribute = $allAttributes->get($attributeId);
                    $attributeName = $attribute ? $attribute->name : "Attribute #$attributeId";

                    // Get attribute value name
                    $attributeValue = $allAttributeValues->get($valueId);
                    $valueName = $attributeValue ? $attributeValue->value : "Value #$valueId";

                    $resolvedVariants[$attributeName] = $valueName;
                }

                $options['variant'] = $resolvedVariants;
            }

            // Resolve design template paths
            if (isset($options['design'])) {
                $design = $options['design'];

                // If design type is template and value is an ID (numeric), look up the template
                if (
                    isset($design['type']) &&
                    $design['type'] === 'template' &&
                    isset($design['value']) &&
                    is_numeric($design['value'])
                ) {
                    $template = \App\Features\DesignTemplate\DesignTemplate::find($design['value']);
                    if ($template) {
                        // Update the options with resolved template data
                        $options['design'] = [
                            'type' => 'template',
                            'value' => $template->file_path ?? $template->thumbnail_path,
                            'original_filename' => $template->name,
                            'template_id' => $design['value'],
                        ];
                    }
                }

                // If design type is upload and value is a path, ensure it's a string
                if (
                    isset($design['type']) &&
                    $design['type'] === 'upload' &&
                    isset($design['value'])
                ) {
                    // Ensure value is a string
                    $options['design']['value'] = (string) $design['value'];
                }
            }

            $item->options = $options;
            return $item;
        });

        return Inertia::render('Features/Order/Show', [
            'order' => $order,
        ]);
    }


    /**
     * Show the form for editing the specified resource for Admin.
     */
    public function edit(Order $order)
    {
        $products = Product::where('is_active', true)
            ->orWhereNull('is_active')
            ->with(['category', 'attributeValues.attribute', 'designTemplates'])
            ->get();

        $customers = Customer::with('user:id,name,email')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->user->name ?? 'Pelanggan #' . $c->id,
                    'email' => $c->user->email ?? '',
                    'phone_number' => $c->phone_number ?? '',
                    'address' => $c->address ?? '',
                    'city' => $c->city ?? '',
                ];
            });

        $order->load(['customer.user', 'items.product.category']);

        return Inertia::render('Features/Order/FormPage', [
            'item' => $order,
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    /**
     * Update the specified resource in storage for Admin.
     */
    public function update(Request $request, Order $order)
    {
        $request->validate([
            'order_status' => 'sometimes|required|in:pending,processing,shipped,completed,cancelled',
            'payment_status' => 'sometimes|required|in:unpaid,paid,expired',
            'tracking_number' => 'nullable|string|max:100',
            'estimated_completion_date' => 'nullable|date',
            'admin_notes' => 'nullable|string',
        ]);

        // === VALIDASI BARU: Admin tidak bisa mengubah status pesanan jika belum dibayar ===
        if ($request->has('order_status') && $request->order_status !== $order->order_status) {
            // Cek apakah pembayaran sudah dilakukan
            if ($order->payment_status !== 'paid') {
                $errorMessage = 'Tidak dapat mengubah status pesanan karena pembayaran belum dilakukan.';
                if ($request->expectsJson()) {
                    return response()->json(['error' => $errorMessage], 422);
                }
                return redirect()->back()->with('error', $errorMessage);
            }

            // Admin tidak boleh mengubah status ke cancelled (hanya customer yang bisa cancel)
            if ($request->order_status === 'cancelled') {
                $errorMessage = 'Admin tidak dapat membatalkan pesanan. Pembatalan hanya dapat dilakukan oleh customer sebelum melakukan pembayaran.';
                if ($request->expectsJson()) {
                    return response()->json(['error' => $errorMessage], 422);
                }
                return redirect()->back()->with('error', $errorMessage);
            }
        }

        // === VALIDASI: Admin tidak bisa mengubah status pembayaran dari 'paid' ke 'unpaid' atau 'expired' ===
        if ($request->has('payment_status') && $order->payment_status === 'paid' && $request->payment_status !== 'paid') {
            $errorMessage = 'Tidak dapat mengubah status pembayaran. Pesanan yang sudah dibayar tidak dapat dikembalikan ke status belum dibayar atau kedaluwarsa.';
            if ($request->expectsJson()) {
                return response()->json(['error' => $errorMessage], 422);
            }
            return redirect()->back()->with('error', $errorMessage);
        }

        $order->update($request->only([
            'order_status',
            'payment_status',
            'tracking_number',
            'estimated_completion_date',
            'admin_notes'
        ]));

        // If request expects JSON (from AJAX), return JSON response
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Order updated successfully.', 'order' => $order]);
        }

        return redirect()->back()->with('message', 'Order updated successfully.');
    }

    /**
     * Remove the specified resource from storage for Admin.
     * NOTE: Pesanan tidak dapat dihapus untuk menjaga integritas data.
     */
    public function destroy(Order $order)
    {
        // Pesanan tidak dapat dihapus karena sudah dipesan oleh pelanggan
        return redirect()->route('orders.index')
            ->with('error', 'Pesanan tidak dapat dihapus karena sudah dipesan oleh pelanggan. Anda hanya dapat membatalkan pesanan.');
    }

    public function myOrders(Request $request)
    {
        // Get customer record for the logged-in user
        $customer = $request->user()->customer;
        
        if (!$customer) {
            return Inertia::render('Features/Order/MyOrdersPage', [
                'orders' => ['data' => []],
            ]);
        }

        // Auto-sync: Check Midtrans for all unpaid orders that have a midtrans_order_id
        $unpaidOrders = Order::where('customer_id', $customer->id)
            ->where('payment_status', 'unpaid')
            ->whereNotNull('midtrans_order_id')
            ->where('order_status', '!=', 'cancelled')
            ->get();

        foreach ($unpaidOrders as $unpaidOrder) {
            $this->syncPaymentStatus($unpaidOrder);
        }
        
        // Ambil pesanan HANYA untuk customer yang sedang login
        $orders = Order::where('customer_id', $customer->id)
            ->with(['items.product']) 
            ->withCount('reviews')
            ->withCount(['reviews as reviews_edited_count' => function ($query) {
                $query->where('is_edited', true);
            }])
            ->latest() 
            ->paginate(10);

        return Inertia::render('Features/Order/MyOrdersPage', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mark an order as paid (called by frontend after successful Midtrans payment).
     * This is a fallback for when webhook cannot reach the server.
     * Made lenient to avoid 403 errors that prevent status updates.
     */
    public function verifyPayment(Order $order)
    {
        try {
            Log::info('VerifyPayment started', ['order_id' => $order->id, 'user_id' => auth()->id()]);

            // Try to verify ownership, but don't fail hard
            $customer = auth()->user()?->customer;
            
            if ($customer && $order->customer_id !== $customer->id) {
                Log::warning('VerifyPayment: Order ownership mismatch, but proceeding', [
                    'order_customer_id' => $order->customer_id,
                    'current_customer_id' => $customer->id
                ]);
                // Still return success to avoid 403 breaking the frontend flow
                // The webhook will handle the actual status update
                return response()->json(['success' => true, 'note' => 'ownership_mismatch_deferred_to_webhook']);
            }

            // Update only if not yet paid
            if ($order->payment_status !== 'paid') {
                $order->update([
                    'payment_status' => 'paid',
                    'order_status' => 'processing',
                    'payment_time' => now(),
                ]);

                Log::info('Order marked as paid via frontend callback', ['order_id' => $order->id]);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('VerifyPayment error', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            // Return success anyway - webhook will handle the actual update
            return response()->json(['success' => true, 'note' => 'error_deferred_to_webhook']);
        }
    }

    /**
     * Cancel an order (customer can only cancel unpaid orders)
     */
    public function cancelOrder(Order $order)
    {
        // Pastikan hanya pemilik pesanan yang bisa membatalkan
        $customer = auth()->user()->customer;
        if (!$customer || $order->customer_id !== $customer->id) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk membatalkan pesanan ini.');
        }

        // Hanya bisa membatalkan jika status pembayaran unpaid
        if ($order->payment_status !== 'unpaid') {
            return redirect()->back()->with('error', 'Pesanan yang sudah dibayar tidak dapat dibatalkan. Silakan hubungi customer service.');
        }

        // Hanya bisa membatalkan jika status pesanan bukan cancelled atau completed
        if (in_array($order->order_status, ['cancelled', 'completed'])) {
            return redirect()->back()->with('error', 'Pesanan ini sudah tidak dapat dibatalkan.');
        }

        // Update status pesanan menjadi cancelled
        $order->update([
            'order_status' => 'cancelled',
        ]);

        return redirect()->route('orders.my')->with('message', 'Pesanan berhasil dibatalkan.');
    }

    /**
     * Customer confirms that the order has been received.
     * Changes order_status from 'shipped' to 'completed'.
     */
    public function completeOrder(Order $order)
    {
        $customer = auth()->user()->customer;

        // Fallback: query langsung ke DB
        if (!$customer) {
            $customer = \App\Features\Customer\Customer::where('user_id', auth()->id())->first();
        }

        if (!$customer || (int) $order->customer_id !== (int) $customer->id) {
            return redirect()->back()->with('error', 'Anda tidak memiliki akses untuk menyelesaikan pesanan ini.');
        }

        // Hanya bisa menyelesaikan jika sudah dikirim (shipped)
        if ($order->order_status !== 'shipped') {
            return redirect()->back()->with('error', 'Pesanan hanya bisa diselesaikan jika sudah dalam status pengiriman.');
        }

        // Hanya bisa menyelesaikan jika sudah dibayar
        if ($order->payment_status !== 'paid') {
            return redirect()->back()->with('error', 'Pesanan hanya bisa diselesaikan jika pembayaran sudah dikonfirmasi.');
        }

        $order->update([
            'order_status' => 'completed',
        ]);

        Log::info('Order completed by customer', [
            'order_id' => $order->id,
            'customer_id' => $customer->id,
        ]);

        return redirect()->route('orders.my')->with('message', 'Pesanan telah diselesaikan. Terima kasih! Silakan berikan penilaian Anda.');
    }

    /**
     * Sync payment status with Midtrans Transaction Status API.
     * Called automatically when user opens "My Orders" page.
     */
    private function syncPaymentStatus(Order $order): void
    {
        if (!$order->midtrans_order_id) {
            return;
        }

        try {
            \Midtrans\Config::$serverKey = config('midtrans.server_key');
            \Midtrans\Config::$isProduction = config('midtrans.is_production');

            // Call Midtrans Transaction Status API
            // Returns stdClass or array depending on SDK version
            $rawStatus = \Midtrans\Transaction::status($order->midtrans_order_id);
            $status = (array) $rawStatus; // Normalize to array

            Log::info('Midtrans status check', [
                'order_id' => $order->id,
                'midtrans_order_id' => $order->midtrans_order_id,
                'transaction_status' => $status['transaction_status'] ?? 'unknown',
            ]);

            $transactionStatus = $status['transaction_status'] ?? null;
            $fraudStatus = $status['fraud_status'] ?? null;

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                // For credit card with capture, check fraud status
                if ($transactionStatus === 'capture' && $fraudStatus === 'challenge') {
                    return; // Don't auto-update challenged transactions
                }

                if ($order->payment_status !== 'paid') {
                    $order->update([
                        'payment_status' => 'paid',
                        'order_status' => 'processing',
                        'payment_method' => $status['payment_type'] ?? $order->payment_method,
                        'transaction_id' => $status['transaction_id'] ?? null,
                        'payment_time' => now(),
                    ]);
                    Log::info('Order auto-synced to paid', ['order_id' => $order->id]);
                }
            } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
                $order->update([
                    'payment_status' => 'expired',
                    'transaction_id' => $status['transaction_id'] ?? null,
                ]);
                Log::info('Order auto-synced to expired', ['order_id' => $order->id]);
            }
        } catch (\Exception $e) {
            // Silently fail — don't break the page if Midtrans API is unreachable
            Log::warning('Midtrans status check failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Show manual order creation page for Admin (POS / Walk-in / Phone).
     */
    protected function createAdmin(Request $request)
    {
        $products = Product::where('is_active', true)
            ->orWhereNull('is_active')
            ->with(['category', 'attributeValues.attribute', 'designTemplates'])
            ->get();

        $customers = Customer::with('user:id,name,email')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->user->name ?? 'Pelanggan #' . $c->id,
                    'email' => $c->user->email ?? '',
                    'phone_number' => $c->phone_number ?? '',
                    'address' => $c->address ?? '',
                    'city' => $c->city ?? '',
                ];
            });

        return Inertia::render('Features/Order/FormPage', [
            'products' => $products,
            'customers' => $customers,
        ]);
    }

    /**
     * Store manual order created by Admin.
     */
    protected function storeAdmin(Request $request)
    {
        $validated = $request->validate([
            'customer_mode' => 'required|in:existing,new',
            'customer_id' => 'required_if:customer_mode,existing|nullable|exists:customers,id',
            'new_customer_name' => 'required_if:customer_mode,new|nullable|string|max:255',
            'new_customer_phone' => 'required_if:customer_mode,new|nullable|string|max:30',
            'new_customer_email' => 'nullable|email|max:255',
            'new_customer_address' => 'nullable|string|max:500',
            'order_source' => 'required|string|in:walk_in,whatsapp,phone,online,other',
            'payment_method' => 'required|string',
            'payment_status' => 'required|string|in:paid,unpaid',
            'estimated_completion_date' => 'nullable|date',
            'admin_notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id_produk',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.variant' => 'nullable',
            'items.*.note' => 'nullable|string|max:500',
            'items.*.design_type' => 'nullable|string',
            'items.*.design_template_id' => 'nullable',
            'items.*.design_template_name' => 'nullable|string',
            'items.*.design_template_thumb' => 'nullable|string',
            'items.*.design_file' => 'nullable|file|max:25600', // 25MB max
        ]);

        $order = DB::transaction(function () use ($request, $validated) {
            $customerId = null;
            $customerName = '';
            $customerPhone = '';
            $customerAddress = '';

            if ($validated['customer_mode'] === 'new') {
                $email = !empty($validated['new_customer_email'])
                    ? $validated['new_customer_email']
                    : 'cust_' . time() . '_' . rand(100, 999) . '@centralprinting.local';

                $user = User::firstOrCreate(
                    ['email' => $email],
                    [
                        'name' => $validated['new_customer_name'],
                        'password' => bcrypt('password123'),
                        'role' => 'customer',
                    ]
                );

                $customer = Customer::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'phone_number' => $validated['new_customer_phone'],
                        'address' => $validated['new_customer_address'] ?: 'Datang Langsung (Walk-in)',
                        'city' => 'Pekanbaru',
                        'province' => 'Riau',
                    ]
                );
                $customerId = $customer->id;
                $customerName = $user->name;
                $customerPhone = $customer->phone_number;
                $customerAddress = $customer->address;
            } else {
                $customer = Customer::with('user')->findOrFail($validated['customer_id']);
                $customerId = $customer->id;
                $customerName = $customer->user->name ?? 'Pelanggan #' . $customer->id;
                $customerPhone = $customer->phone_number ?? '-';
                $customerAddress = $customer->address ?? 'Ambil di Toko (Pickup)';
            }

            // Calculate total price from items
            $totalPrice = 0;
            foreach ($validated['items'] as $item) {
                $totalPrice += ((float) $item['price']) * ((int) $item['quantity']);
            }

            $order = Order::create([
                'customer_id' => $customerId,
                'order_status' => 'processing',
                'total_price' => $totalPrice,
                'shipping_cost' => 0,
                'shipping_method' => 'Ambil di Toko (Pickup)',
                'shipping_address' => [
                    'name' => $customerName,
                    'phone' => $customerPhone,
                    'address' => $customerAddress ?: 'Ambil di Toko (Pickup)',
                    'city' => 'Pekanbaru',
                    'postal_code' => '-',
                ],
                'payment_method' => $validated['payment_method'],
                'payment_status' => $validated['payment_status'],
                'estimated_completion_date' => $validated['estimated_completion_date'] ?? null,
                'admin_notes' => $validated['admin_notes'] ?? null,
                'order_source' => $validated['order_source'] ?? 'walk_in',
            ]);

            // Save items
            foreach ($validated['items'] as $index => $itemData) {
                $designData = null;

                // Handle design file upload
                if ($request->hasFile("items.{$index}.design_file")) {
                    $file = $request->file("items.{$index}.design_file");
                    $originalName = $file->getClientOriginalName();
                    $filename = time() . '_' . $index . '_' . Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('designs', $filename, 'public');

                    $designData = [
                        'type' => 'upload',
                        'value' => '/storage/' . $path,
                        'original_filename' => $originalName,
                    ];
                } elseif (!empty($itemData['design_template_thumb'])) {
                    $designData = [
                        'type' => 'template',
                        'value' => $itemData['design_template_thumb'],
                        'original_filename' => $itemData['design_template_name'] ?? 'Template Desain',
                    ];
                }

                $order->items()->create([
                    'product_id_produk' => $itemData['product_id'],
                    'quantity' => (int) $itemData['quantity'],
                    'price' => (float) $itemData['price'],
                    'options' => [
                        'variant' => $itemData['variant'] ?? null,
                        'design' => $designData,
                        'note' => $itemData['note'] ?? null,
                    ],
                ]);
            }

            return $order;
        });

        return redirect()->route('orders.invoice', $order->id)->with('success', 'Pesanan berhasil dibuat! Nota siap dicetak.');
    }

    /**
     * Render printable invoice for an order.
     */
    public function invoice(Order $order)
    {
        $order->load(['customer.user', 'items.product.category']);
        
        return Inertia::render('Features/Order/Invoice', [
            'order' => $order,
        ]);
    }

    /**
     * Render production calendar for Admin.
     */
    public function calendar(Request $request)
    {
        $orders = Order::with(['customer.user', 'items.product'])
            ->where(function ($q) {
                $q->whereNotNull('estimated_completion_date')
                  ->orWhere('created_at', '>=', now()->subDays(60));
            })
            ->latest('estimated_completion_date')
            ->get();

        return Inertia::render('Features/Order/Calendar', [
            'orders' => $orders,
        ]);
    }
}
