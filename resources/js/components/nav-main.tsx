import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [], label }: { items: NavItem[], label?: string }) {
    const page = usePage();
    const currentPath = page.url.split('?')[0];

    const isItemActive = (item: NavItem) => {
        const itemUrl = typeof item.href === 'string' ? item.href : item.href.url;
        const itemPath = itemUrl.split('?')[0];

        // 1. Exact match
        if (currentPath === itemPath) return true;

        // 2. Prefix match for sub-pages (e.g. /products/create, /orders/1)
        if (itemPath !== '/' && currentPath.startsWith(itemPath + '/')) {
            // Check if there is another item in the same menu with a more specific match
            const hasMoreSpecificMatch = items.some((other) => {
                if (other === item) return false;
                const otherUrl = typeof other.href === 'string' ? other.href : other.href.url;
                const otherPath = otherUrl.split('?')[0];
                return currentPath.startsWith(otherPath) && otherPath.length > itemPath.length;
            });
            return !hasMoreSpecificMatch;
        }

        return false;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label || 'Platform'}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isItemActive(item)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
