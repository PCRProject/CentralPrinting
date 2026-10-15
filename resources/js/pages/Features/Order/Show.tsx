import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SiteLayout from '@/layouts/SiteLayout';
import { PageProps, BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Package, Truck, CreditCard, User, MapPin,
    Download, FileIcon, ChevronLeft, Calendar,
    Mail, Phone, Info, Eye, Clock, CheckCircle, XCircle, Wallet, Loader2, Printer
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Order, OrderStatus, PaymentStatus, OrderItem } from './types';

// Midtrans Snap type declaration
declare global {
    interface Window {
        snap: {
            pay: (
                token: string,
                options: {
                    onSuccess?: (result: unknown) => void;
                    onPending?: (result: unknown) => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}

// Status configurations for display
const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-800', icon: Package },
    shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800', icon: Truck },
    completed: { label: 'Selesai', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
    unpaid: { label: 'Belum Dibayar', color: 'bg-red-100 text-red-800' },
    paid: { label: 'Sudah Dibayar', color: 'bg-green-100 text-green-800' },
    expired: { label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-800' },
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Orders', href: route('orders.index') },
    { title: 'Detail Order', href: '#' },
];

export default function Show({ order }: PageProps<{ order: Order }>) {
    const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isPayingOrder, setIsPayingOrder] = useState(false);

    // Check if order can be paid
    const canPayOrder = order.payment_status === 'unpaid' &&
        !['cancelled', 'completed'].includes(order.order_status?.toLowerCase());

    // Handle pay order — buka Midtrans Snap popup
    const handlePayOrder = async () => {
        setIsPayingOrder(true);

        try {
            const response = await axios.post(route('payment.createToken', { order: order.id }));
            const { snap_token } = response.data;

            if (snap_token && window.snap) {
                window.snap.pay(snap_token, {
                    onSuccess: async (result: unknown) => {
                        console.log('Payment success:', result);
                        try {
                            await axios.post(route('payment.verify', order.id));
                        } catch (err) {
                            console.error('Gagal update status pembayaran:', err);
                        }
                        toast.success('Pembayaran berhasil!');
                        router.visit(window.location.href, { preserveScroll: true });
                    },
                    onPending: (result: unknown) => {
                        console.log('Payment pending:', result);
                        toast.info('Menunggu pembayaran. Silakan selesaikan pembayaran Anda.');
                        setIsPayingOrder(false);
                    },
                    onError: (result: unknown) => {
                        console.error('Payment error:', result);
                        toast.error('Pembayaran gagal. Silakan coba lagi.');
                        setIsPayingOrder(false);
                    },
                    onClose: () => {
                        console.log('Payment popup closed');
                        toast.info('Anda menutup popup pembayaran. Pesanan Anda tetap tersimpan.');
                        setIsPayingOrder(false);
                    },
                });
            } else {
                toast.error('Midtrans Snap tidak tersedia. Silakan refresh halaman.');
                setIsPayingOrder(false);
            }
        } catch (error) {
            console.error('Failed to create payment token:', error);
            toast.error('Gagal memulai pembayaran. Silakan coba lagi.');
            setIsPayingOrder(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleOpenDetail = (item: OrderItem) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    // Calculate subtotal from items
    const subtotal = order.items?.reduce((acc, item) => acc + (item.price * item.quantity), 0) ?? 0;
    const tax = subtotal * 0.11;

    // Get status configurations
    const orderStatusConfig = ORDER_STATUS_CONFIG[order.order_status] || ORDER_STATUS_CONFIG.pending;
    const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
    const StatusIcon = orderStatusConfig.icon;

    // Get design image URL - handles both uploaded files and template URLs
    const getDesignUrl = (design: { type: string; value: string | number; original_filename?: string } | null | undefined): string | null => {
        if (!design || !design.value) return null;

        // Ensure value is a string (backend might send ID as number in some edge cases)
        const valueStr = String(design.value);
        if (!valueStr || valueStr === 'null' || valueStr === 'undefined') return null;

        // If it's a relative path (uploaded file), prepend /storage/
        if (!valueStr.startsWith('http')) {
            // Clean up path: replace backslashes, remove duplicate leading slashes or 'public/'
            let cleanPath = valueStr.replace(/\\/g, '/').replace(/^public\//, '').replace(/^\/+/, '');
            return `/storage/${cleanPath}`;
        }
        return valueStr;
    };

    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    const CustomerLayout = ({ children }: { children: React.ReactNode; breadcrumbs?: any }) => (
        <SiteLayout>
            <div className="container mx-auto py-8">
                {children}
            </div>
        </SiteLayout>
    );

    const Layout = isAdmin ? AppLayout : CustomerLayout;

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title={`Order #${order.id}`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-2">
                        {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 mt-1" asChild>
                                <Link href={route('orders.index')}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Pesanan #{order.id}</h1>
                            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(order.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:ml-0 flex-wrap">
                        <Badge variant="outline" className={`capitalize ${orderStatusConfig.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            Status: {orderStatusConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`capitalize ${paymentStatusConfig.color}`}>
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pembayaran: {paymentStatusConfig.label}
                        </Badge>
                        <Link href={route('orders.invoice', order.id)}>
                            <Button size="sm" variant="outline" className="gap-1.5 border-orange-200 hover:bg-orange-50 text-orange-700">
                                <Printer className="h-4 w-4" />
                                Cetak Nota
                            </Button>
                        </Link>
                        {/* Tombol Bayar Sekarang - hanya tampil jika unpaid */}
                        {canPayOrder && (
                            <Button
                                size="sm"
                                className="bg-[#FF6500] hover:bg-[#e05a00] text-white"
                                disabled={isPayingOrder}
                                onClick={handlePayOrder}
                            >
                                {isPayingOrder ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Bayar Sekarang
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Product Details */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Produk & Desain
                                </CardTitle>
                                <CardDescription>Daftar item yang dipesan dan file desain.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Desain Preview</TableHead>
                                            <TableHead>Harga</TableHead>
                                            <TableHead>Jml</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item) => {
                                                const designUrl = getDesignUrl(item.options?.design);
                                                return (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="w-[30%]">
                                                            <div className="font-medium">{item.product?.nama_produk || 'Product'}</div>
                                                            {item.options?.variant && (
                                                                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                                                    {Object.entries(item.options.variant || {}).map(([key, value]) => (
                                                                        <div key={key}><span className="opacity-70">{key}:</span> {value}</div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {item.options?.note && (
                                                                <div className="mt-2 text-xs italic text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100 flex items-start gap-1.5">
                                                                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                    <span>Catatan: {item.options.note}</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="w-[25%] px-0">
                                                            {item.options?.design ? (
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="h-12 w-12 rounded overflow-hidden bg-slate-50 border cursor-pointer hover:opacity-80 transition-opacity"
                                                                        onClick={() => handleOpenDetail(item)}
                                                                    >
                                                                        {designUrl ? (
                                                                            <img
                                                                                src={designUrl}
                                                                                alt="Thumb"
                                                                                className="h-full w-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="h-full w-full flex items-center justify-center">
                                                                                <FileIcon className="h-4 w-4 text-muted-foreground" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <Badge variant="secondary" className="text-[10px] h-5 mb-1">
                                                                            {item.options.design.type === 'upload' ? 'Upload' : 'Template'}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs italic">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(item.price)}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell className="font-medium">
                                                            {formatCurrency(item.price * item.quantity)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDetail(item)} title="Lihat Detail & Spesifikasi">
                                                                <Eye className="h-4 w-4 text-slate-500" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada item dalam pesanan ini.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Order Calculation */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal Produk</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Biaya Pengiriman ({order.shipping_method?.toUpperCase() || 'N/A'})
                                        </span>
                                        <span>{formatCurrency(order.shipping_cost || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Pajak PPN (11%)</span>
                                        <span>{formatCurrency(Math.round(tax))}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total Pembayaran</span>
                                        <span className="text-primary">{formatCurrency(order.total_price)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tracking & Admin Notes - Show if available */}
                        {(order.tracking_number || order.admin_notes || order.estimated_completion_date) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Info className="h-4 w-4" />
                                        Informasi Tambahan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    {order.tracking_number && (
                                        <div className="space-y-1">
                                            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Nomor Resi</div>
                                            <div className="font-mono bg-muted px-3 py-2 rounded">{order.tracking_number}</div>
                                        </div>
                                    )}
                                    {order.estimated_completion_date && (
                                        <div className="space-y-1">
                                            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Estimasi Selesai</div>
                                            <div>{new Date(order.estimated_completion_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                    )}
                                    {order.admin_notes && (
                                        <div className="space-y-1">
                                            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Catatan Admin</div>
                                            <div className="bg-muted px-3 py-2 rounded whitespace-pre-wrap">{order.admin_notes}</div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Customer & Shipping Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="h-4 w-4" />
                                    Informasi Pelanggan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{order.customer?.user?.name || 'Customer'}</div>
                                        <div className="text-muted-foreground text-xs">Customer ID: #{order.customer?.id || order.customer_id}</div>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span>{order.customer?.user?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{order.shipping_address?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="h-4 w-4" />
                                    Pengiriman
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Metode</div>
                                    <div className="font-medium capitalize">{order.shipping_method?.replace('_', ' ').toUpperCase() || 'N/A'}</div>
                                </div>

                                <div className="space-y-1">
                                    <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Metode Pembayaran</div>
                                    <div className="font-medium capitalize">{order.payment_method?.replace('_', ' ') || 'N/A'}</div>
                                </div>

                                {order.shipping_address && (
                                    <div className="space-y-1">
                                        <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Alamat Penerima</div>
                                        <div className="flex gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium">{order.shipping_address.name}</div>
                                                <div className="text-muted-foreground leading-relaxed">
                                                    {order.shipping_address.address}<br />
                                                    {order.shipping_address.city}, {order.shipping_address.postal_code}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* PRODUCT DETAIL POPUP */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Detail Spesifikasi Produk</DialogTitle>
                        <DialogDescription>
                            Informasi lengkap mengenai produk dan desain yang dipesan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Product Info Column */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Informasi Produk</h3>
                                    <div className="flex gap-4">
                                        <div className="h-24 w-24 flex-shrink-0 rounded-lg bg-white overflow-hidden border p-1">
                                            {selectedItem.product?.gambar_url ? (
                                                <img
                                                    src={selectedItem.product.gambar_url}
                                                    alt={selectedItem.product?.nama_produk || 'Product'}
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold">{selectedItem.product?.nama_produk || 'Product'}</div>
                                            <div className="mt-2 font-medium text-primary">{formatCurrency(selectedItem.price)} x {selectedItem.quantity}</div>
                                        </div>
                                    </div>
                                </div>

                                {selectedItem.options?.variant && Object.keys(selectedItem.options.variant).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Spesifikasi Varian</h3>
                                        <div className="bg-slate-50 rounded-lg p-3 border grid grid-cols-2 gap-2 text-sm">
                                            {Object.entries(selectedItem.options.variant || {}).map(([key, value]) => (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-xs text-slate-400 uppercase">{key}</span>
                                                    <span className="font-medium">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedItem.options?.note && (
                                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 space-y-2">
                                        <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                                            <Info className="h-4 w-4" />
                                            Catatan dari Pelanggan
                                        </div>
                                        <p className="text-sm text-orange-900 italic whitespace-pre-wrap">
                                            "{selectedItem.options.note}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Design Info Column */}
                            <div className="space-y-4 border-l pl-0 md:pl-6 border-dashed">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-muted-foreground">Preview Desain</h3>
                                    {selectedItem.options?.design && (
                                        <Badge variant={selectedItem.options.design.type === 'upload' ? 'default' : 'secondary'}>
                                            {selectedItem.options.design.type === 'upload' ? 'Custom Upload' : 'Template Toko'}
                                        </Badge>
                                    )}
                                </div>

                                {selectedItem.options?.design ? (
                                    <div className="space-y-4">
                                        <div className="aspect-square w-full bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
                                            {getDesignUrl(selectedItem.options.design) ? (
                                                <img
                                                    src={getDesignUrl(selectedItem.options.design)!}
                                                    alt="Full Design Preview"
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : (
                                                <FileIcon className="h-16 w-16 text-muted-foreground" />
                                            )}
                                            {selectedItem.options.design.type === 'upload' && getDesignUrl(selectedItem.options.design) && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="gap-2"
                                                        asChild
                                                    >
                                                        <a href={getDesignUrl(selectedItem.options.design)!} download target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" /> Unduh File
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {selectedItem.options.design.original_filename && (
                                            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex gap-2 items-start">
                                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="font-bold text-xs uppercase mb-0.5">File Name</div>
                                                    <div className="font-mono break-all">{selectedItem.options.design.original_filename}</div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedItem.options.design.type === 'template' && (
                                            <p className="text-xs text-muted-foreground text-center">
                                                User memilih template desain yang disediakan oleh toko.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                                        <FileIcon className="h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">Tidak ada desain custom</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Layout >
    );
}
