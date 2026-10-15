import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import { overviewNavItems, commerceNavItems, operationalNavItems } from '@/lib/navigation';
import { type NavItem, type SharedData } from '@/types';

export function AppSidebar() {
    const { features } = usePage<SharedData & { features?: Record<string, boolean> }>().props;

    const filterByFeature = (items: NavItem[]) => {
        if (!features) return items;
        return items.filter(item => !item.featureKey || features[item.featureKey] !== false);
    };

    const filteredCommerce = filterByFeature(commerceNavItems);
    const filteredOperational = filterByFeature(operationalNavItems);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={overviewNavItems} label="Ringkasan" />
                {filteredCommerce.length > 0 && <NavMain items={filteredCommerce} label="Bisnis" />}
                {filteredOperational.length > 0 && <NavMain items={filteredOperational} label="Operasional" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
