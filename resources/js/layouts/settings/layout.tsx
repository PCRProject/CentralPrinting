import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { appearance } from '@/routes';
import { edit as editPassword } from '@/routes/password';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Sliders } from 'lucide-react';
import { type PropsWithChildren } from 'react';
import { route } from 'ziggy-js';

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;

    const navItems: NavItem[] = [
        {
            title: 'Password',
            href: editPassword(),
            icon: null,
        },
        {
            title: 'Appearance',
            href: appearance(),
            icon: null,
        },
        ...(auth?.user?.role === 'admin'
            ? [
                  {
                      title: 'Fitur Aplikasi',
                      href: route('settings.features.index', undefined, false),
                      icon: Sliders,
                  },
              ]
            : []),
    ];

    return (
        <div className="px-4 py-6">
            <Heading title="Settings" description="Manage your profile, account and application features" />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {navItems.map((item, index) => (
                            <Button
                                key={`${typeof item.href === 'string' ? item.href : item.href.url}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === (typeof item.href === 'string' ? item.href : item.href.url),
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
