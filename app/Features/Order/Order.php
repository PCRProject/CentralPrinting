<?php

namespace App\Features\Order;

use App\Features\Customer\Customer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Order
 * 
 * Valid order_status values: pending, confirmed, processing, printing, ready, shipped, delivered, completed, cancelled
 * Valid payment_status values: unpaid, pending, paid, failed, refunded, expired
 */
class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'order_status',
        'total_price',
        'shipping_address',
        'shipping_cost',
        'shipping_method',
        'payment_method',
        'payment_status',
        'tracking_number',
        'estimated_completion_date',
        'admin_notes',
        'order_source',
        // Midtrans payment fields
        'snap_token',
        'midtrans_order_id',
        'transaction_id',
        'payment_time',
    ];

    protected $casts = [
        'shipping_address' => 'array',
        'estimated_completion_date' => 'date',
        'payment_time' => 'datetime',
    ];

    /**
     * Get the customer that owns the order.
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews()
    {
        return $this->hasMany(\App\Features\Review\Review::class);
    }
}