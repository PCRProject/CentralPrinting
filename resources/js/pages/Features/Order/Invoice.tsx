import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Printer, ArrowLeft, Eye, CheckCircle2, Clock,
    Phone, Mail, MapPin, Calendar, FileText, Download
} from 'lucide-react';
import { Order } from './types';

interface Props {
    order: Order;
}

export default function Invoice({ order }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const formatRp = (amount: number | string | undefined | null) => {
        const val = Number(amount) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const isPaid = order.payment_status === 'paid';

    return (
        <div className="min-h-screen bg-muted/40 py-8 px-4 sm:px-6 print:bg-white print:p-0">
            <Head title={`Nota Pesanan #CP-${order.id}`} />

            {/* ACTION BAR (Hidden when printed) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-2">
                    <Link href={route('orders.index')}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar Pesanan
                        </Button>
                    </Link>
                    <Link href={route('orders.show', order.id)}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            Lihat Detail Lengkap
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handlePrint}
                        className="bg-[#FF6500] hover:bg-[#e05900] text-white gap-2 font-medium shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak Nota Sekarang
                    </Button>
                </div>
            </div>

            {/* PRINTABLE INVOICE SHEET */}
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border print:border-none print:shadow-none p-8 sm:p-12 text-gray-800">
                {/* Header Percetakan */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <img
                                src="/storage/logo/logo.png"
                                alt="Central Printing Logo"
                                className="h-12 w-auto object-contain"
                                onError={(e) => {
                                    // Fallback if logo file is not loaded
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                                    CENTRAL PRINTING
                                </h1>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Digital & Offset Printing Solution
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                            Jl. HR. Soebrantas No. 88, Panam, Pekanbaru, Riau<br />
                            WhatsApp / Telp: 0812-3456-7890 | Email: cs@centralprinting.com
                        </p>
                    </div>

                    {/* Invoice ID & Status Badge */}
                    <div className="text-left sm:text-right space-y-2">
                        <div className="inline-block">
                            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground block">
                                NOTA TRANSAKSI
                            </span>
                            <span className="text-2xl font-extrabold text-[#FF6500] tracking-tight">
                                #CP-{String(order.id).padStart(6, '0')}
                            </span>
                        </div>

                        <div>
                            {isPaid ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-100 text-green-800 border border-green-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    LUNAS
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                    BELUM LUNAS / DP
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Pelanggan & Info Pengerjaan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b text-sm">
                    {/* Data Pelanggan */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                            Dipesan Oleh:
                        </span>
                        <p className="font-bold text-gray-900 text-base">
                            {order.customer?.user?.name || order.shipping_address?.name || 'Pelanggan Walk-in'}
                        </p>
                        <p className="text-gray-600 text-xs">
                            No. HP / WA: {order.shipping_address?.phone || '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                            Alamat: {order.shipping_address?.address || 'Ambil Langsung di Toko'}
                        </p>
                    </div>

                    {/* Info Tanggal & Pengerjaan */}
                    <div className="space-y-1 sm:text-right">
                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                            Jadwal Pengerjaan:
                        </span>
                        <p className="text-xs text-gray-600">
                            Tanggal Pesan: <span className="font-medium text-gray-800">{formatDate(order.created_at)}</span>
                        </p>
                        <p className="text-xs font-semibold text-orange-600">
                            Target Selesai: {formatDate(order.estimated_completion_date)}
                        </p>
                        <p className="text-xs text-gray-600">
                            Metode Pembayaran: <span className="font-medium uppercase">{order.payment_method || 'Tunai'}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                            Pengambilan: <span className="font-medium">{order.shipping_method || 'Ambil di Toko'}</span>
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="py-6 border-b">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider">
                                <th className="py-3 px-3 w-10 text-center">No</th>
                                <th className="py-3 px-3">Item Produk & Spesifikasi</th>
                                <th className="py-3 px-3 text-center w-16">Qty</th>
                                <th className="py-3 px-3 text-right w-28">Harga Satuan</th>
                                <th className="py-3 px-3 text-right w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items?.map((item, index) => {
                                const variantSpecs = item.options?.variant;
                                const designInfo = item.options?.design;
                                const itemNote = item.options?.note;

                                return (
                                    <tr key={item.id || index} className="align-top">
                                        <td className="py-3 px-3 text-center text-xs text-muted-foreground">
                                            {index + 1}
                                        </td>
                                        <td className="py-3 px-3 space-y-1">
                                            <p className="font-semibold text-gray-900">
                                                {item.product?.nama_produk || 'Produk Percetakan'}
                                            </p>

                                            {/* Varian / Atribut */}
                                            {variantSpecs && Object.keys(variantSpecs).length > 0 && (
                                                <div className="flex flex-wrap gap-1 text-[11px] text-gray-600">
                                                    {Object.entries(variantSpecs).map(([key, val]) => (
                                                        <span
                                                            key={key}
                                                            className="inline-block bg-gray-100 px-1.5 py-0.5 rounded border text-gray-700 font-medium"
                                                        >
                                                            {key}: {val}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Info Desain */}
                                            {designInfo && (
                                                <p className="text-[11px] text-orange-600">
                                                    Desain: {designInfo.original_filename || designInfo.type}
                                                </p>
                                            )}

                                            {/* Catatan Item */}
                                            {itemNote && (
                                                <p className="text-[11px] text-gray-500 italic">
                                                    Catatan: "{itemNote}"
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3 px-3 text-center font-medium text-gray-800">
                                            {item.quantity}
                                        </td>
                                        <td className="py-3 px-3 text-right text-gray-700">
                                            {formatRp(item.price)}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                                            {formatRp(item.price * item.quantity)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Catatan Khusus & Ringkasan Total */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b items-start">
                    {/* Admin Notes */}
                    <div className="space-y-2">
                        {order.admin_notes && (
                            <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-lg text-xs space-y-1">
                                <span className="font-semibold text-orange-900 block">
                                    Catatan Pengerjaan / Operator:
                                </span>
                                <p className="text-orange-800 whitespace-pre-line leading-relaxed">
                                    {order.admin_notes}
                                </p>
                            </div>
                        )}

                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                            <p className="font-semibold text-gray-700 mb-0.5">Ketentuan Pengambilan:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Wajib membawa nota ini saat mengambil hasil cetakan.</li>
                                <li>Silakan periksa kelengkapan dan kualitas cetak saat penerimaan.</li>
                                <li>Komplain maksimal 1x24 jam setelah barang diambil.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Total Breakdown */}
                    <div className="space-y-2 text-sm sm:max-w-xs sm:ml-auto w-full">
                        <div className="flex justify-between text-gray-600 text-xs">
                            <span>Subtotal Produk:</span>
                            <span className="font-medium">
                                {formatRp(
                                    order.items?.reduce((acc, it) => acc + it.price * it.quantity, 0)
                                )}
                            </span>
                        </div>

                        {Number(order.shipping_cost) > 0 && (
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>Ongkos Kirim:</span>
                                <span className="font-medium">{formatRp(order.shipping_cost)}</span>
                            </div>
                        )}

                        <Separator />

                        <div className="flex justify-between items-baseline pt-1">
                            <span className="font-bold text-gray-900 text-base">TOTAL TAGIHAN:</span>
                            <span className="text-xl font-extrabold text-[#FF6500]">
                                {formatRp(order.total_price)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tanda Tangan */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-gray-700">
                    <div className="space-y-16">
                        <p className="font-medium text-muted-foreground">Penerima / Pelanggan,</p>
                        <div>
                            <p className="font-bold underline uppercase">
                                ( {order.customer?.user?.name || order.shipping_address?.name || 'Pelanggan'} )
                            </p>
                        </div>
                    </div>
                    <div className="space-y-16">
                        <p className="font-medium text-muted-foreground">Kasir / Operator Central Printing,</p>
                        <div>
                            <p className="font-bold underline uppercase">
                                ( Petugas Toko )
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-10 pt-4 border-t text-center text-[11px] text-muted-foreground">
                    Terima kasih telah mempercayakan kebutuhan cetak Anda kepada Central Printing!
                </div>
            </div>
        </div>
    );
}
