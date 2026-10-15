import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { 
    Globe, 
    ShoppingBag, 
    Package, 
    Users, 
    Star, 
    MapPin, 
    Sliders,
    Info
} from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

interface FeatureItem {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

interface FeaturesPageProps {
    featuresList: FeatureItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fitur Aplikasi',
        href: '/settings/features',
    },
];

const featureIcons: Record<string, typeof Globe> = {
    customer_portal: Globe,
    orders: ShoppingBag,
    products: Package,
    customers: Users,
    reviews: Star,
    stores: MapPin,
};

export default function FeaturesSettings({ featuresList }: FeaturesPageProps) {
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const handleToggle = (key: string, currentEnabled: boolean, label: string) => {
        setLoadingKey(key);
        const nextEnabled = !currentEnabled;

        router.patch(
            route('settings.features.update'),
            {
                key,
                enabled: nextEnabled,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoadingKey(null);
                    toast.success(
                        `${label} berhasil ${nextEnabled ? 'diaktifkan' : 'dinonaktifkan'}.`
                    );
                },
                onError: () => {
                    setLoadingKey(null);
                    toast.error(`Gagal mengubah status ${label}.`);
                },
            }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Fitur Aplikasi" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <HeadingSmall
                            title="Saklar Fitur Aplikasi (Feature Flags)"
                            description="Aktifkan atau nonaktifkan modul sistem secara dinamis tanpa perlu deploy ulang kode."
                        />
                    </div>

                    {/* Informasi Penggunaan */}
                    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                        <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-blue-900">
                                Cara Kerja Saklar Fitur
                            </p>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Menonaktifkan fitur akan menyembunyikan menu terkait di bilah navigasi admin dan secara otomatis mencegat akses rute di latar belakang.
                                Khusus <strong>Portal Pelanggan</strong>, mematikannya akan mengunci akses toko publik dan mengalihkan seluruh pengunjung langsung ke Portal Login Admin.
                            </p>
                        </div>
                    </div>

                    {/* Daftar Kartu Fitur */}
                    <div className="grid gap-4">
                        {featuresList.map((item) => {
                            const IconComponent = featureIcons[item.key] || Sliders;
                            const isPending = loadingKey === item.key;

                            return (
                                <Card
                                    key={item.key}
                                    className={`transition-all duration-200 border ${
                                        item.enabled 
                                            ? 'border-gray-200 bg-white hover:border-orange-200' 
                                            : 'border-gray-100 bg-gray-50/80 opacity-80'
                                    }`}
                                >
                                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div
                                                className={`p-2.5 rounded-xl shrink-0 ${
                                                    item.enabled
                                                        ? 'bg-orange-50 text-orange-600'
                                                        : 'bg-gray-200 text-gray-500'
                                                }`}
                                            >
                                                <IconComponent className="h-5 w-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-semibold text-gray-900">
                                                        {item.label}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-2 py-0.5 font-medium ${
                                                            item.enabled
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                        }`}
                                                    >
                                                        {item.enabled ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                            <span className="text-xs text-gray-500 sm:hidden">
                                                {item.enabled ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                            <Switch
                                                id={`switch-${item.key}`}
                                                checked={item.enabled}
                                                disabled={isPending}
                                                onCheckedChange={() =>
                                                    handleToggle(item.key, item.enabled, item.label)
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
