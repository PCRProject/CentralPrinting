import { type NavItem } from "@/types";
import { dashboard } from "@/routes";
import { route } from 'ziggy-js';
import {
    LayoutGrid,
    ShoppingBag,
    Calendar,
    Package,
    Users,
    Star,
    MapPin,
    Settings,
    FileText
} from "lucide-react";

export const overviewNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
];

export const commerceNavItems: NavItem[] = [
    {
        title: 'Pesanan',
        href: route('orders.index', undefined, false),
        icon: ShoppingBag,
        featureKey: 'orders',
    },
    {
        title: 'Jadwal',
        href: route('orders.calendar', undefined, false),
        icon: Calendar,
        featureKey: 'orders',
    },
    {
        title: 'Produk',
        href: route('products.index', undefined, false),
        icon: Package,
        featureKey: 'products',
    },
    {
        title: 'Pelanggan',
        href: route('customers.index', undefined, false),
        icon: Users,
        featureKey: 'customers',
    },
    {
        title: 'Ulasan',
        href: route('reviews.index', undefined, false),
        icon: Star,
        featureKey: 'reviews',
    },
];

export const operationalNavItems: NavItem[] = [
    {
        title: 'Toko & Lokasi',
        href: route('stores.index', undefined, false),
        icon: MapPin,
        featureKey: 'stores',
    },
    {
        title: 'Pengaturan Fitur',
        href: route('settings.features.index', undefined, false),
        icon: Settings,
    },
];

export const mainNavItems: NavItem[] = [
    ...overviewNavItems,
    ...commerceNavItems,
    ...operationalNavItems,
];
