import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    MoreHorizontal, Eye, Pencil, Search, Package, Truck, CheckCircle, XCircle, Clock, CreditCard, Ban,
    Loader2, Lock, Plus, Calendar, Printer
} from 'lucide-react';
import debounce from 'lodash.debounce';
import { Order, OrderStatus, PaymentStatus } from './types';

// Types for pagination
interface Pagination<T> {
    data: T[];
    from: number;
    to: number;
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Filters {
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    status?: string;
    payment_status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Orders', href: route('orders.index') },
];

// Order status configurations
const ORDER_STATUSES: { value: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'pending', label: 'Menunggu', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 'processing', label: 'Diproses', icon: Package, color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'shipped', label: 'Dikirim', icon: Truck, color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { value: 'completed', label: 'Selesai', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'cancelled', label: 'Dibatalkan', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
];

const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
    { value: 'unpaid', label: 'Belum Dibayar', color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 'paid', label: 'Sudah Dibayar', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 'expired', label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export default function Index({ items, filters }: PageProps<{ items: Pagination<Order>; filters: Filters }>) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [paymentFilter, setPaymentFilter] = useState(filters.payment_status || 'all');

    // Local state for optimistic updates
    const [localOrders, setLocalOrders] = useState<Order[]>(items.data);

    // Sync local orders with server data when items change
    useEffect(() => {
        setLocalOrders(items.data);
    }, [items.data]);

    // Modal state for quick status update
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const { data, setData, post, patch, processing, reset } = useForm({
        order_status: '' as OrderStatus,
        payment_status: '' as PaymentStatus,
        tracking_number: '',
        admin_notes: '',
    });

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(route('orders.index'), {
                search: value,
                status: statusFilter,
                payment_status: paymentFilter,
            }, { preserveState: true, replace: true });
        }, 300),
        [statusFilter, paymentFilter]
    );

    // Handled directly in onChange now to avoid mount-triggered reloads
    // useEffect(() => {
    //    debouncedSearch(search);
    //    return () => debouncedSearch.cancel();
    // }, [search, debouncedSearch]);

    // Handle filter changes
    const handleFilterChange = (type: 'status' | 'payment_status', value: string) => {
        if (type === 'status') {
            setStatusFilter(value);
        } else {
            setPaymentFilter(value);
        }
        router.get(route('orders.index'), {
            search,
            status: type === 'status' ? value : statusFilter,
            payment_status: type === 'payment_status' ? value : paymentFilter,
        }, { preserveState: true, replace: true });
    };

    // Open update modal
    const openUpdateModal = (order: Order) => {
        setSelectedOrder(order);
        setData({
            order_status: order.order_status,
            payment_status: order.payment_status,
            tracking_number: order.tracking_number || '',
            admin_notes: order.admin_notes || '',
        });
        setUpdateModalOpen(true);
    };

    // Handle status update submission
    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        post(route('orders.update.post', selectedOrder.id), {
            onSuccess: () => {
                setUpdateModalOpen(false);
                reset();
            },
        });
    };

    // Quick ORDER status update (inline) with optimistic UI
    const handleQuickStatusUpdate = (order: Order, newStatus: OrderStatus) => {
        // Optimistic update - update UI immediately
        setLocalOrders(prev => prev.map(o =>
            o.id === order.id ? { ...o, order_status: newStatus } : o
        ));

        router.post(route('orders.update.post', order.id), {
            order_status: newStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: () => {
                // Rollback on error
                setLocalOrders(items.data);
            }
        });
    };

    // Quick PAYMENT status update (inline) with optimistic UI
    const handleQuickPaymentUpdate = (order: Order, newStatus: PaymentStatus) => {
        // Optimistic update - update UI immediately
        setLocalOrders(prev => prev.map(o =>
            o.id === order.id ? { ...o, payment_status: newStatus } : o
        ));

        router.post(route('orders.update.post', order.id), {
            payment_status: newStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
            onError: () => {
                // Rollback on error
                setLocalOrders(items.data);
            }
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    // Get status config
    const getStatusConfig = (status: OrderStatus) => {
        return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    };

    // Get payment status config
    const getPaymentStatusConfig = (status: PaymentStatus) => {
        return PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[0];
    };

    // NOTE: Pesanan tidak dapat dihapus untuk menjaga integritas data
    // Fungsi hapus dihapus karena pesanan dari pelanggan tidak boleh dihapus

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Pesanan" />
            <div className="p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>Kelola Pesanan</CardTitle>
                                <CardDescription>Lihat dan kelola pesanan pelanggan, cetak nota, dan jadwal pengerjaan.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={route('orders.calendar')}>
                                    <Button variant="outline" className="gap-2">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        Jadwal
                                    </Button>
                                </Link>
                                <Link href={route('orders.create')}>
                                    <Button className="bg-[#FF6500] hover:bg-[#e05900] text-white gap-2 font-medium">
                                        <Plus className="h-4 w-4" />
                                        Buat Pesanan Baru
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4">
                            <div className="relative flex-1 w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari pesanan..."
                                    className="w-full rounded-lg bg-background pl-8 sm:w-[250px]"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => handleFilterChange('status', v)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    {ORDER_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            <div className="flex items-center gap-2">
                                                <status.icon className="h-4 w-4" />
                                                {status.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={paymentFilter} onValueChange={(v) => handleFilterChange('payment_status', v)}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Filter Pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                                    {PAYMENT_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Pelanggan</TableHead>
                                        <TableHead>Status Pesanan</TableHead>
                                        <TableHead>Pembayaran</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Pengiriman</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Tidak ada pesanan ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        localOrders.map((order) => {
                                            const statusConfig = getStatusConfig(order.order_status);
                                            const paymentConfig = getPaymentStatusConfig(order.payment_status);
                                            const StatusIcon = statusConfig.icon;

                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{order.customer?.user?.name || 'N/A'}</div>
                                                        <div className="text-sm text-muted-foreground">{order.customer?.user?.email || ''}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {/* Status Pesanan - Hanya bisa diubah jika sudah paid */}
                                                        {order.payment_status === 'paid' ? (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 p-0">
                                                                        <Badge className={`${statusConfig.color} border cursor-pointer transition-all duration-200`}>
                                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                                            {statusConfig.label}
                                                                        </Badge>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    <DropdownMenuLabel>Ubah Status</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {/* Filter out 'cancelled' - admin tidak bisa cancel */}
                                                                    {ORDER_STATUSES.filter(status => status.value !== 'cancelled').map((status) => (
                                                                        <DropdownMenuItem
                                                                            key={status.value}
                                                                            onClick={() => handleQuickStatusUpdate(order, status.value)}
                                                                            disabled={order.order_status === status.value}
                                                                        >
                                                                            <status.icon className="h-4 w-4 mr-2" />
                                                                            {status.label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        ) : (
                                                            /* Status tidak bisa diubah jika belum paid */
                                                            <Badge className={`${statusConfig.color} border opacity-70`} title="Pembayaran belum dilakukan">
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {statusConfig.label}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.payment_status === 'paid' ? (
                                                            /* Sudah dibayar - tidak bisa diubah */
                                                            <Badge className={`${paymentConfig.color} border`} title="Status pembayaran sudah final">
                                                                <Lock className="h-3 w-3 mr-1" />
                                                                {paymentConfig.label}
                                                            </Badge>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 p-0">
                                                                        <Badge className={`${paymentConfig.color} border cursor-pointer transition-all duration-200`}>
                                                                            <CreditCard className="h-3 w-3 mr-1" />
                                                                            {paymentConfig.label}
                                                                        </Badge>
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start">
                                                                    <DropdownMenuLabel>Ubah Pembayaran</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    {PAYMENT_STATUSES.map((status) => (
                                                                        <DropdownMenuItem
                                                                            key={status.value}
                                                                            onClick={() => handleQuickPaymentUpdate(order, status.value)}
                                                                            disabled={order.payment_status === status.value}
                                                                        >
                                                                            <CreditCard className="h-4 w-4 mr-2" />
                                                                            {status.label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCurrency(order.total_price)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <span className="capitalize">{order.shipping_method?.toUpperCase()}</span>
                                                        </div>
                                                        {order.tracking_number && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Resi: {order.tracking_number}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(order.created_at)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('orders.show', order.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        Lihat Detail
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('orders.invoice', order.id)}>
                                                                        <Printer className="mr-2 h-4 w-4" />
                                                                        Cetak Nota / Invoice
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={route('orders.edit', order.id)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit Pesanan
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openUpdateModal(order)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Quick Update Status
                                                                </DropdownMenuItem>
                                                                {/* Tombol hapus dihapus - pesanan tidak dapat dihapus */}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                {items.total > 0 ? (
                                    <>Menampilkan {items.from}-{items.to} dari {items.total} pesanan</>
                                ) : (
                                    'Tidak ada data'
                                )}
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!items.prev_page_url}
                                    onClick={() => items.prev_page_url && router.get(items.prev_page_url)}
                                >
                                    Sebelumnya
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!items.next_page_url}
                                    onClick={() => items.next_page_url && router.get(items.next_page_url)}
                                >
                                    Berikutnya
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Update Order Modal */}
            <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Kelola Pesanan #{selectedOrder?.id}</DialogTitle>
                        <DialogDescription>
                            Update status pesanan, pembayaran, dan informasi pengiriman.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="order_status">Status Pesanan</Label>
                                <Select
                                    value={data.order_status}
                                    onValueChange={(v) => setData('order_status', v as OrderStatus)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ORDER_STATUSES.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                <div className="flex items-center gap-2">
                                                    <status.icon className="h-4 w-4" />
                                                    {status.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payment_status">Status Pembayaran</Label>
                                {selectedOrder?.payment_status === 'paid' ? (
                                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                                        <Lock className="h-4 w-4" />
                                        <span>Sudah Dibayar — status tidak dapat diubah</span>
                                    </div>
                                ) : (
                                    <Select
                                        value={data.payment_status}
                                        onValueChange={(v) => setData('payment_status', v as PaymentStatus)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status pembayaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tracking_number">Nomor Resi (Pengiriman)</Label>
                                <Input
                                    id="tracking_number"
                                    placeholder="Masukkan nomor resi jika sudah dikirim"
                                    value={data.tracking_number}
                                    onChange={(e) => setData('tracking_number', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="admin_notes">Catatan Admin</Label>
                                <Textarea
                                    id="admin_notes"
                                    placeholder="Catatan internal untuk pesanan ini..."
                                    value={data.admin_notes}
                                    onChange={(e) => setData('admin_notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}