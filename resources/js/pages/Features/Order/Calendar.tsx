import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
    Package, CheckCircle2, AlertCircle, Plus, Eye, Printer,
    Search, User, Phone, Filter, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, OrderStatus } from './types';

interface Props extends PageProps {
    orders: Order[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Pesanan', href: route('orders.index') },
    { title: 'Jadwal Pengerjaan', href: route('orders.calendar') },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Menunggu', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300' },
    processing: { label: 'Diproses / Dicetak', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300' },
    shipped: { label: 'Dikirim', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300' },
    completed: { label: 'Selesai / Diambil', bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' },
    cancelled: { label: 'Dibatalkan', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
};

export default function CalendarPage({ auth, orders = [] }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Navigation handlers
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        return orders.filter((o) => {
            const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
            const q = searchQuery.toLowerCase().trim();
            const custName = (o.customer?.user?.name || o.shipping_address?.name || '').toLowerCase();
            const orderIdStr = String(o.id);
            const matchesSearch = !q || custName.includes(q) || orderIdStr.includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [orders, statusFilter, searchQuery]);

    // Group orders by completion date (YYYY-MM-DD)
    const ordersByDate = useMemo(() => {
        const map: Record<string, Order[]> = {};
        filteredOrders.forEach((o) => {
            if (o.estimated_completion_date) {
                // Ensure date string format YYYY-MM-DD
                const d = new Date(o.estimated_completion_date).toISOString().split('T')[0];
                if (!map[d]) map[d] = [];
                map[d].push(o);
            }
        });
        return map;
    }, [filteredOrders]);

    // Today's & Overdue orders for the Priority Sidebar
    const todayStr = new Date().toISOString().split('T')[0];
    const priorityOrders = useMemo(() => {
        return filteredOrders
            .filter((o) => {
                if (!o.estimated_completion_date) return false;
                const d = new Date(o.estimated_completion_date).toISOString().split('T')[0];
                // Include overdue and today's orders that are not completed or cancelled
                return d <= todayStr && !['completed', 'cancelled'].includes(o.order_status);
            })
            .sort((a, b) => (a.estimated_completion_date! > b.estimated_completion_date! ? 1 : -1));
    }, [filteredOrders, todayStr]);

    // Generate Calendar Days for Current Month View
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday as first day (0 = Monday, 6 = Sunday)
        const totalDays = lastDayOfMonth.getDate();

        const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

        // Previous month days padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({
                date: d,
                dateStr: d.toISOString().split('T')[0],
                isCurrentMonth: false,
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(year, month, i);
            days.push({
                date: d,
                dateStr: d.toISOString().split('T')[0],
                isCurrentMonth: true,
            });
        }

        // Next month days padding to fill 35 or 42 grid cells
        const remaining = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: d,
                dateStr: d.toISOString().split('T')[0],
                isCurrentMonth: false,
            });
        }

        return days;
    }, [currentDate]);

    // Quick status update from calendar modal
    const handleUpdateStatus = (orderId: number, newStatus: string) => {
        router.post(
            route('orders.update.post', orderId),
            { order_status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status pengerjaan berhasil diperbarui!');
                    setSelectedOrder(null);
                },
            }
        );
    };

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jadwal Pengerjaan & Antrian Produksi" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <CalendarIcon className="h-6 w-6 text-[#FF6500]" />
                            Jadwal Pengerjaan & Produksi
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kalender khusus admin untuk memantau deadline pesanan cetak dan prioritas pengerjaan mesin.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route('orders.index')}>
                            <Button variant="outline" size="sm">
                                Daftar Semua Pesanan
                            </Button>
                        </Link>
                        <Link href={route('orders.create')}>
                            <Button size="sm" className="bg-[#FF6500] hover:bg-[#e05900] text-white gap-2 font-medium">
                                <Plus className="h-4 w-4" />
                                Buat Pesanan Baru
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters & Month Navigator */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-bold min-w-44 text-center text-gray-800">
                            {currentMonthLabel}
                        </h2>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs ml-1">
                            Hari Ini
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau No. Order..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="processing">Diproses / Dicetak</SelectItem>
                                <SelectItem value="shipped">Dikirim</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* MAIN GRID: Calendar (Left) & Priority Queue (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* CALENDAR MONTH GRID (3 Cols) */}
                    <div className="lg:col-span-3 bg-card border rounded-xl shadow-xs overflow-hidden">
                        {/* Day names header */}
                        <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2 text-xs font-semibold text-gray-600">
                            <div>Senin</div>
                            <div>Selasa</div>
                            <div>Rabu</div>
                            <div>Kamis</div>
                            <div>Jumat</div>
                            <div>Sabtu</div>
                            <div className="text-red-500">Minggu</div>
                        </div>

                        {/* Calendar cells */}
                        <div className="grid grid-cols-7 divide-x divide-y divide-border min-h-[550px]">
                            {calendarDays.map((cell, idx) => {
                                const dayOrders = ordersByDate[cell.dateStr] || [];
                                const isToday = cell.dateStr === todayStr;

                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 min-h-24 flex flex-col justify-between transition-colors ${
                                            cell.isCurrentMonth ? 'bg-card' : 'bg-muted/15 text-muted-foreground'
                                        } ${isToday ? 'bg-orange-50/50 ring-1 ring-inset ring-[#FF6500]/40' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                                    isToday
                                                        ? 'bg-[#FF6500] text-white font-extrabold'
                                                        : cell.isCurrentMonth
                                                        ? 'text-gray-800'
                                                        : 'text-gray-400'
                                                }`}
                                            >
                                                {cell.date.getDate()}
                                            </span>

                                            {dayOrders.length > 0 && (
                                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                                    {dayOrders.length} order
                                                </span>
                                            )}
                                        </div>

                                        {/* Order items on this date */}
                                        <div className="space-y-1 flex-1 overflow-y-auto max-h-24 scrollbar-thin">
                                            {dayOrders.slice(0, 3).map((o) => {
                                                const statusCfg = STATUS_CONFIG[o.order_status] || STATUS_CONFIG.pending;
                                                const firstItem = o.items?.[0];
                                                const itemName = firstItem?.product?.nama_produk || 'Pesanan';

                                                return (
                                                    <button
                                                        key={o.id}
                                                        type="button"
                                                        onClick={() => setSelectedOrder(o)}
                                                        className={`w-full text-left p-1 rounded text-[11px] font-medium border truncate block transition-all hover:scale-[1.02] shadow-2xs ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                                                    >
                                                        <div className="truncate font-semibold">
                                                            #{o.id} {o.customer?.user?.name || o.shipping_address?.name || 'Pelanggan'}
                                                        </div>
                                                        <div className="truncate text-[10px] opacity-85">
                                                            {itemName} ({o.items?.reduce((acc, it) => acc + it.quantity, 0)} pcs)
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {dayOrders.length > 3 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(dayOrders[0])}
                                                    className="w-full text-center text-[10px] font-semibold text-orange-600 hover:underline pt-0.5"
                                                >
                                                    +{dayOrders.length - 3} order lainnya
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* PRIORITY QUEUE SIDEBAR (1 Col) */}
                    <div className="space-y-4">
                        <Card className="border-orange-200 shadow-xs">
                            <CardHeader className="bg-orange-50/70 pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                        <CardTitle className="text-sm">Antrian Prioritas</CardTitle>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {priorityOrders.length} Butuh Aksi
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs">
                                    Pesanan yang jatuh tempo hari ini atau terlewat dan belum selesai.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-3 divide-y max-h-[500px] overflow-y-auto space-y-3">
                                {priorityOrders.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-80" />
                                        Semua pesanan deadline hari ini sudah selesai dikerjakan!
                                    </div>
                                ) : (
                                    priorityOrders.map((o) => {
                                        const statusCfg = STATUS_CONFIG[o.order_status] || STATUS_CONFIG.pending;
                                        return (
                                            <div key={o.id} className="pt-3 first:pt-0 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-xs text-gray-900">
                                                        #CP-{o.id}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${statusCfg.bg} ${statusCfg.text}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                    {o.customer?.user?.name || o.shipping_address?.name || 'Pelanggan'}
                                                </p>

                                                <div className="text-[11px] text-muted-foreground">
                                                    {o.items?.map((it, i) => (
                                                        <span key={i} className="block truncate">
                                                            • {it.product?.nama_produk} ({it.quantity}x)
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[10px] font-semibold text-orange-600 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {o.estimated_completion_date}
                                                    </span>

                                                    <div className="flex items-center gap-1">
                                                        <Link href={route('orders.invoice', o.id)}>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-600" title="Cetak Nota">
                                                                <Printer className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[11px] px-2"
                                                            onClick={() => setSelectedOrder(o)}
                                                        >
                                                            Kelola
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* MODAL QUICK VIEW & STATUS UPDATE */}
                {selectedOrder && (
                    <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <div className="flex items-center justify-between pr-4">
                                    <DialogTitle>Pesanan #CP-{selectedOrder.id}</DialogTitle>
                                    <Badge variant="outline" className={STATUS_CONFIG[selectedOrder.order_status]?.text}>
                                        {STATUS_CONFIG[selectedOrder.order_status]?.label}
                                    </Badge>
                                </div>
                                <DialogDescription className="text-xs">
                                    Target Selesai: <span className="font-semibold text-orange-600">{selectedOrder.estimated_completion_date}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2 text-xs">
                                {/* Customer Info */}
                                <div className="p-3 bg-muted/40 rounded-lg space-y-1 border">
                                    <p className="font-semibold text-gray-800 text-sm">
                                        {selectedOrder.customer?.user?.name || selectedOrder.shipping_address?.name || 'Pelanggan'}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {selectedOrder.shipping_address?.phone || '-'}
                                    </p>
                                </div>

                                {/* Items Breakdown */}
                                <div className="space-y-2">
                                    <span className="font-semibold text-gray-700 block">Daftar Produk:</span>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {selectedOrder.items?.map((it, idx) => (
                                            <div key={idx} className="p-2 border rounded bg-card flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">{it.product?.nama_produk}</p>
                                                    {it.options?.variant && (
                                                        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1 mt-0.5">
                                                            {Object.entries(it.options.variant).map(([k, v]) => (
                                                                <span key={k} className="bg-muted px-1 rounded">{k}: {v}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {it.options?.note && (
                                                        <p className="text-[10px] italic text-orange-600 mt-0.5">Catatan: {it.options.note}</p>
                                                    )}
                                                </div>
                                                <span className="font-bold">{it.quantity} Pcs</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                {selectedOrder.admin_notes && (
                                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded text-orange-900">
                                        <span className="font-semibold block mb-0.5">Catatan Operator:</span>
                                        <p>{selectedOrder.admin_notes}</p>
                                    </div>
                                )}

                                {/* Status Quick Changer */}
                                <div className="space-y-1.5 pt-2">
                                    <span className="font-semibold text-gray-800">Ubah Status Pengerjaan:</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8 border-blue-200 hover:bg-blue-50 text-blue-700"
                                            onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                                        >
                                            Sedang Dicetak
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8 border-green-200 hover:bg-green-50 text-green-700"
                                            onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                                        >
                                            Siap / Selesai
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t">
                                <Link href={route('orders.invoice', selectedOrder.id)}>
                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                        <Printer className="h-3.5 w-3.5" />
                                        Cetak Nota
                                    </Button>
                                </Link>
                                <Link href={route('orders.show', selectedOrder.id)}>
                                    <Button size="sm" className="bg-[#FF6500] hover:bg-[#e05900] text-white text-xs gap-1.5">
                                        <Eye className="h-3.5 w-3.5" />
                                        Detail Pesanan
                                    </Button>
                                </Link>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
