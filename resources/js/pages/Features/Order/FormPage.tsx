import React, { useState, useMemo } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { PageProps, BreadcrumbItem } from '@/types';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Plus, Trash2, Calendar, User, Phone, MapPin, UploadCloud,
    FileText, ShoppingBag, CreditCard, Clock, CheckCircle2,
    ArrowLeft, Image as ImageIcon, Sparkles, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductAttributeValue {
    id: number;
    attribute_id: number;
    value: string;
    attribute?: { id: number; name: string };
    pivot?: { price: number | string };
}

interface DesignTemplate {
    id: number;
    name: string;
    thumbnail_path: string;
}

interface ProductItem {
    id_produk: number;
    nama_produk: string;
    harga: number | string;
    gambar_url?: string;
    allow_custom_design?: boolean;
    enable_design_feature?: boolean;
    category?: { name: string };
    attribute_values?: ProductAttributeValue[];
    design_templates?: DesignTemplate[];
}

interface CustomerOption {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    address: string;
    city: string;
}

interface OrderItemForm {
    product_id: number | '';
    quantity: number;
    price: number;
    variant: Record<string, string>;
    note: string;
    design_type: 'upload' | 'template' | 'none';
    design_template_id: number | null;
    design_template_name: string;
    design_template_thumb: string;
    design_file: File | null;
    design_file_preview: string | null;
}

interface Props extends PageProps {
    products: ProductItem[];
    customers: CustomerOption[];
}

export default function FormPage({ auth, products = [], customers = [] }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pesanan', href: route('orders.index') },
        { title: 'Buat Pesanan Baru', href: route('orders.create') },
    ];

    // Customer mode: existing or new
    const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
    const [customerSearch, setCustomerSearch] = useState('');

    // Default tomorrow's date for estimated completion
    const defaultDate = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        customer_mode: 'new' as 'existing' | 'new',
        customer_id: '' as number | '',
        new_customer_name: '',
        new_customer_phone: '',
        new_customer_email: '',
        new_customer_address: '',
        order_source: 'walk_in' as 'walk_in' | 'whatsapp' | 'phone' | 'online' | 'other',
        payment_method: 'cash',
        payment_status: 'paid' as 'paid' | 'unpaid',
        estimated_completion_date: defaultDate,
        admin_notes: '',
        items: [
            {
                product_id: products[0]?.id_produk || '',
                quantity: 1,
                price: Number(products[0]?.harga || 0),
                variant: {},
                note: '',
                design_type: 'none' as 'upload' | 'template' | 'none',
                design_template_id: null,
                design_template_name: '',
                design_template_thumb: '',
                design_file: null as File | null,
                design_file_preview: null as string | null,
            }
        ] as OrderItemForm[],
    });

    // Filter customers by search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return customers;
        const q = customerSearch.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.phone_number.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q)
        );
    }, [customers, customerSearch]);

    // Handle adding item
    const handleAddItem = () => {
        const firstProd = products[0];
        setData('items', [
            ...data.items,
            {
                product_id: firstProd?.id_produk || '',
                quantity: 1,
                price: Number(firstProd?.harga || 0),
                variant: {},
                note: '',
                design_type: 'none',
                design_template_id: null,
                design_template_name: '',
                design_template_thumb: '',
                design_file: null,
                design_file_preview: null,
            },
        ]);
    };

    // Handle removing item
    const handleRemoveItem = (index: number) => {
        if (data.items.length <= 1) {
            toast.error('Pesanan harus memiliki minimal satu produk.');
            return;
        }
        const updated = [...data.items];
        updated.splice(index, 1);
        setData('items', updated);
    };

    // Handle product selection change for an item
    const handleProductChange = (index: number, productId: number) => {
        const prod = products.find((p) => p.id_produk === productId);
        if (!prod) return;

        const updated = [...data.items];
        updated[index] = {
            ...updated[index],
            product_id: productId,
            price: Number(prod.harga || 0),
            variant: {},
            design_type: 'none',
            design_template_id: null,
            design_template_name: '',
            design_template_thumb: '',
            design_file: null,
            design_file_preview: null,
        };
        setData('items', updated);
    };

    // Handle attribute variant selection
    const handleVariantChange = (itemIndex: number, attrName: string, value: string, priceDelta: number) => {
        const updated = [...data.items];
        const currentItem = updated[itemIndex];
        const newVariants = { ...currentItem.variant, [attrName]: value };

        // Recalculate price: base product price + all selected variant adjustments
        const prod = products.find((p) => p.id_produk === currentItem.product_id);
        let basePrice = Number(prod?.harga || 0);

        if (prod?.attribute_values) {
            Object.entries(newVariants).forEach(([k, v]) => {
                const matchAttr = prod.attribute_values?.find(
                    (av) => (av.attribute?.name || '') === k && av.value === v
                );
                if (matchAttr?.pivot?.price) {
                    basePrice += Number(matchAttr.pivot.price);
                }
            });
        }

        updated[itemIndex] = {
            ...currentItem,
            variant: newVariants,
            price: basePrice,
        };
        setData('items', updated);
    };

    // Handle file upload for design
    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const updated = [...data.items];
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

        updated[index] = {
            ...updated[index],
            design_type: 'upload',
            design_file: file,
            design_file_preview: previewUrl,
        };
        setData('items', updated);
    };

    // Calculate Grand Total
    const grandTotal = useMemo(() => {
        return data.items.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity || 1)), 0);
    }, [data.items]);

    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (customerMode === 'existing' && !data.customer_id) {
            toast.error('Silakan pilih pelanggan yang terdaftar.');
            return;
        }
        if (customerMode === 'new' && (!data.new_customer_name || !data.new_customer_phone)) {
            toast.error('Nama dan Nomor HP pelanggan wajib diisi.');
            return;
        }
        if (data.items.some((it) => !it.product_id)) {
            toast.error('Pastikan semua item telah memilih produk.');
            return;
        }

        post(route('orders.store'), {
            forceFormData: true,
            onError: (err) => {
                console.error(err);
                toast.error('Gagal membuat pesanan. Mohon periksa kembali form.');
            },
        });
    };

    // Format currency helper
    const formatRp = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Pesanan Baru (Manual POS)" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href={route('orders.index')}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Buat Pesanan Baru (Admin / Walk-in)
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-10">
                            Catat pesanan dari WhatsApp atau pelanggan yang datang langsung, tentukan deadline, dan cetak nota.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route('orders.calendar')}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Calendar className="h-4 w-4 text-orange-600" />
                                Lihat Kalender Pengerjaan
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT & CENTER: Form Inputs (2 Cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. DATA PELANGGAN */}
                        <Card className="border-orange-100 shadow-sm">
                            <CardHeader className="bg-orange-50/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                            1
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Informasi Pelanggan</CardTitle>
                                            <CardDescription>Pilih pelanggan terdaftar atau buat baru untuk walk-in/WA</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={customerMode === 'new' ? 'default' : 'ghost'}
                                            className={customerMode === 'new' ? 'bg-[#FF6500] hover:bg-[#e05900] text-white' : ''}
                                            onClick={() => {
                                                setCustomerMode('new');
                                                setData('customer_mode', 'new');
                                            }}
                                        >
                                            Pelanggan Baru / Walk-in
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={customerMode === 'existing' ? 'default' : 'ghost'}
                                            className={customerMode === 'existing' ? 'bg-[#FF6500] hover:bg-[#e05900] text-white' : ''}
                                            onClick={() => {
                                                setCustomerMode('existing');
                                                setData('customer_mode', 'existing');
                                            }}
                                        >
                                            Pilih Dari Daftar
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {customerMode === 'existing' ? (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label>Cari & Pilih Pelanggan</Label>
                                            <Select
                                                value={String(data.customer_id)}
                                                onValueChange={(val) => setData('customer_id', Number(val))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="-- Pilih Pelanggan Terdaftar --" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customers.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{c.name}</span>
                                                                <span className="text-xs text-muted-foreground">({c.phone_number || c.email || 'Tanpa Kontak'})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.customer_id && <p className="text-xs text-red-500">{errors.customer_id}</p>}
                                        </div>

                                        {/* Preview Selected Customer */}
                                        {data.customer_id && (
                                            <div className="p-3 bg-muted/40 rounded-lg text-sm border space-y-1">
                                                {(() => {
                                                    const selected = customers.find((c) => c.id === data.customer_id);
                                                    return selected ? (
                                                        <>
                                                            <p className="font-semibold text-gray-800">{selected.name}</p>
                                                            <p className="text-xs text-muted-foreground">Telp / WA: {selected.phone_number || '-'}</p>
                                                            <p className="text-xs text-muted-foreground">Alamat: {selected.address || 'Ambil di Toko'}</p>
                                                        </>
                                                    ) : null;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="cust_name">
                                                Nama Pelanggan <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="cust_name"
                                                placeholder="Contoh: Bpk. Budi Santoso"
                                                value={data.new_customer_name}
                                                onChange={(e) => setData('new_customer_name', e.target.value)}
                                            />
                                            {errors.new_customer_name && <p className="text-xs text-red-500">{errors.new_customer_name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="cust_phone">
                                                No. WhatsApp / HP <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="cust_phone"
                                                placeholder="Contoh: 081234567890"
                                                value={data.new_customer_phone}
                                                onChange={(e) => setData('new_customer_phone', e.target.value)}
                                            />
                                            {errors.new_customer_phone && <p className="text-xs text-red-500">{errors.new_customer_phone}</p>}
                                        </div>
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="cust_address">Alamat / Catatan Lokasi (Opsional)</Label>
                                            <Input
                                                id="cust_address"
                                                placeholder="Alamat pelanggan atau 'Ambil di Toko'"
                                                value={data.new_customer_address}
                                                onChange={(e) => setData('new_customer_address', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. DAFTAR ITEM PRODUK */}
                        <Card className="border-orange-100 shadow-sm">
                            <CardHeader className="bg-orange-50/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                            2
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Produk & Spesifikasi Pengerjaan</CardTitle>
                                            <CardDescription>Pilih produk percetakan, bahan, ukuran, dan file desain</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                                        onClick={handleAddItem}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Produk Lain
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-6">
                                {data.items.map((item, idx) => {
                                    const selectedProd = products.find((p) => p.id_produk === item.product_id);

                                    // Group attributes by attribute name
                                    const attributeGroups: Record<string, ProductAttributeValue[]> = {};
                                    selectedProd?.attribute_values?.forEach((av) => {
                                        const groupName = av.attribute?.name || 'Varian';
                                        if (!attributeGroups[groupName]) {
                                            attributeGroups[groupName] = [];
                                        }
                                        attributeGroups[groupName].push(av);
                                    });

                                    return (
                                        <div
                                            key={idx}
                                            className="p-4 rounded-xl border bg-card/60 relative space-y-4 shadow-xs"
                                        >
                                            {/* Item Header */}
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <Badge variant="secondary" className="font-semibold text-xs">
                                                    Item #{idx + 1}
                                                </Badge>
                                                {data.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 h-7 px-2"
                                                        onClick={() => handleRemoveItem(idx)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                        Hapus Item
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Product Selection & Quantity */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="sm:col-span-2 space-y-1.5">
                                                    <Label>Pilih Produk Percetakan</Label>
                                                    <Select
                                                        value={String(item.product_id)}
                                                        onValueChange={(val) => handleProductChange(idx, Number(val))}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Pilih produk..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((p) => (
                                                                <SelectItem key={p.id_produk} value={String(p.id_produk)}>
                                                                    {p.nama_produk} ({formatRp(Number(p.harga))})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label>Jumlah (Qty)</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = Math.max(1, parseInt(e.target.value) || 1);
                                                            const updated = [...data.items];
                                                            updated[idx].quantity = val;
                                                            setData('items', updated);
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Dynamic Attributes / Variants (e.g. Bahan, Ukuran, Finishing) */}
                                            {Object.keys(attributeGroups).length > 0 && (
                                                <div className="p-3 bg-muted/30 rounded-lg space-y-3 border">
                                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Spesifikasi / Varian Produk
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {Object.entries(attributeGroups).map(([groupName, values]) => (
                                                            <div key={groupName} className="space-y-1">
                                                                <Label className="text-xs font-medium">{groupName}</Label>
                                                                <Select
                                                                    value={item.variant[groupName] || ''}
                                                                    onValueChange={(val) => {
                                                                        const matched = values.find((v) => v.value === val);
                                                                        handleVariantChange(
                                                                            idx,
                                                                            groupName,
                                                                            val,
                                                                            Number(matched?.pivot?.price || 0)
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-9 text-xs">
                                                                        <SelectValue placeholder={`Pilih ${groupName}`} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {values.map((v) => (
                                                                            <SelectItem key={v.id} value={v.value} className="text-xs">
                                                                                {v.value}
                                                                                {Number(v.pivot?.price) > 0 &&
                                                                                    ` (+${formatRp(Number(v.pivot?.price))})`}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Design Upload / Template Selection */}
                                            <div className="p-3 bg-muted/20 rounded-lg space-y-3 border">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                                        <ImageIcon className="h-3.5 w-3.5 text-orange-600" />
                                                        File Desain Pelanggan
                                                    </Label>
                                                    {selectedProd?.design_templates && selectedProd.design_templates.length > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {selectedProd.design_templates.length} Template Tersedia
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {/* Upload Desain */}
                                                    <div className="space-y-1.5">
                                                        <span className="text-xs text-muted-foreground">Unggah File (Gambar / PDF)</span>
                                                        <div className="border border-dashed rounded-lg p-2.5 text-center hover:bg-orange-50/30 transition-colors">
                                                            <input
                                                                type="file"
                                                                id={`file_${idx}`}
                                                                className="hidden"
                                                                accept="image/*,application/pdf"
                                                                onChange={(e) => handleFileChange(idx, e)}
                                                            />
                                                            <label
                                                                htmlFor={`file_${idx}`}
                                                                className="cursor-pointer flex flex-col items-center justify-center gap-1"
                                                            >
                                                                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                                                <span className="text-xs font-medium text-orange-600">
                                                                    Pilih File Desain
                                                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    JPG, PNG, PDF max 25MB
                                                                </span>
                                                            </label>
                                                        </div>

                                                        {item.design_file && (
                                                            <div className="flex items-center gap-2 mt-1 p-1.5 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                                                <span className="truncate">{item.design_file.name}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Template Desain (jika ada) */}
                                                    {selectedProd?.design_templates && selectedProd.design_templates.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            <span className="text-xs text-muted-foreground">Atau Pilih Template Toko</span>
                                                            <Select
                                                                value={String(item.design_template_id || '')}
                                                                onValueChange={(val) => {
                                                                    const t = selectedProd.design_templates?.find(
                                                                        (tmpl) => tmpl.id === Number(val)
                                                                    );
                                                                    const updated = [...data.items];
                                                                    updated[idx] = {
                                                                        ...updated[idx],
                                                                        design_type: 'template',
                                                                        design_template_id: Number(val),
                                                                        design_template_name: t?.name || '',
                                                                        design_template_thumb: t?.thumbnail_path || '',
                                                                    };
                                                                    setData('items', updated);
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-9 text-xs">
                                                                    <SelectValue placeholder="Pilih Template Desain" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {selectedProd.design_templates.map((tmpl) => (
                                                                        <SelectItem key={tmpl.id} value={String(tmpl.id)} className="text-xs">
                                                                            {tmpl.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center p-3 text-xs text-muted-foreground bg-muted/20 rounded-lg">
                                                            Pelanggan dapat mengirim desain via WA atau dibuatkan tim desain toko.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Item Note & Subtotal */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
                                                <div className="sm:col-span-2 space-y-1">
                                                    <Label className="text-xs">Catatan Khusus Produk Ini</Label>
                                                    <Input
                                                        placeholder="Contoh: Mata ayam 4 sudut, laminasi doff, potong pas"
                                                        value={item.note}
                                                        onChange={(e) => {
                                                            const updated = [...data.items];
                                                            updated[idx].note = e.target.value;
                                                            setData('items', updated);
                                                        }}
                                                        className="text-xs h-9"
                                                    />
                                                </div>
                                                <div className="text-right sm:text-right">
                                                    <span className="text-[11px] text-muted-foreground block">Subtotal Item</span>
                                                    <span className="text-base font-bold text-gray-900">
                                                        {formatRp(Number(item.price) * Number(item.quantity || 1))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: Order Settings & Summary (1 Col) */}
                    <div className="space-y-6">
                        {/* 3. PENGATURAN PENGERJAAN & PEMBAYARAN */}
                        <Card className="border-orange-100 shadow-sm sticky top-6">
                            <CardHeader className="bg-orange-50/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                        3
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Pengerjaan & Pembayaran</CardTitle>
                                        <CardDescription>Target selesai & status pembayaran</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {/* Order Source */}
                                <div className="space-y-1.5">
                                    <Label>Sumber Pesanan</Label>
                                    <Select
                                        value={data.order_source}
                                        onValueChange={(val: any) => setData('order_source', val)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="walk_in">Datang Langsung (Walk-in Toko)</SelectItem>
                                            <SelectItem value="whatsapp">Chat WhatsApp</SelectItem>
                                            <SelectItem value="phone">Telepon</SelectItem>
                                            <SelectItem value="other">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Estimated Completion Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="completion_date" className="flex items-center gap-1.5 text-gray-800 font-medium">
                                        <Calendar className="h-4 w-4 text-orange-600" />
                                        Target Selesai Pengerjaan (Deadline)
                                    </Label>
                                    <Input
                                        id="completion_date"
                                        type="date"
                                        value={data.estimated_completion_date}
                                        onChange={(e) => setData('estimated_completion_date', e.target.value)}
                                        className="font-medium"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Tanggal ini akan otomatis masuk ke Kalender Jadwal Produksi.
                                    </p>
                                </div>

                                <Separator />

                                {/* Payment Method & Status */}
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label>Metode Pembayaran</Label>
                                        <Select
                                            value={data.payment_method}
                                            onValueChange={(val) => setData('payment_method', val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Tunai / Cash</SelectItem>
                                                <SelectItem value="transfer_bca">Transfer Bank BCA</SelectItem>
                                                <SelectItem value="transfer_mandiri">Transfer Mandiri</SelectItem>
                                                <SelectItem value="qris">QRIS / E-Wallet</SelectItem>
                                                <SelectItem value="other">Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Status Pembayaran</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                type="button"
                                                variant={data.payment_status === 'paid' ? 'default' : 'outline'}
                                                className={data.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                                onClick={() => setData('payment_status', 'paid')}
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                                Lunas
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={data.payment_status === 'unpaid' ? 'default' : 'outline'}
                                                className={data.payment_status === 'unpaid' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                                                onClick={() => setData('payment_status', 'unpaid')}
                                            >
                                                <Clock className="h-4 w-4 mr-1.5" />
                                                Belum Lunas / DP
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Admin General Notes */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="admin_notes">Catatan Tambahan untuk Operator</Label>
                                    <Textarea
                                        id="admin_notes"
                                        placeholder="Catatan pengerjaan mesin, instruksi packing, atau permintaan khusus pelanggan..."
                                        rows={3}
                                        value={data.admin_notes}
                                        onChange={(e) => setData('admin_notes', e.target.value)}
                                        className="text-xs"
                                    />
                                </div>

                                {/* Total Summary */}
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-2">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Jumlah Item:</span>
                                        <span className="font-semibold text-gray-800">{data.items.length} Macam</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Total Unit:</span>
                                        <span className="font-semibold text-gray-800">
                                            {data.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)} Pcs
                                        </span>
                                    </div>
                                    <Separator className="bg-orange-200" />
                                    <div className="flex justify-between items-baseline pt-1">
                                        <span className="font-bold text-gray-900 text-sm">Total Bayar:</span>
                                        <span className="text-xl font-extrabold text-[#FF6500]">
                                            {formatRp(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[#FF6500] hover:bg-[#e05900] text-white font-semibold py-5 text-base gap-2 shadow-md"
                                >
                                    <FileText className="h-5 w-5" />
                                    {processing ? 'Menyimpan...' : 'Simpan & Cetak Nota'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
