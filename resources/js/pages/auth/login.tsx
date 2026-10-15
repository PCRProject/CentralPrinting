import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { request } from '@/routes/password';
import { type SharedData } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { route } from 'ziggy-js';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { features } = usePage<SharedData & { features?: Record<string, boolean> }>().props;
    const isCustomerPortalEnabled = features?.customer_portal ?? false;

    return (
        <AuthLayout
            title={isCustomerPortalEnabled ? "Masuk ke Akun Anda" : "Portal Administrator"}
            description={
                isCustomerPortalEnabled
                    ? "Masukkan email dan kata sandi Anda untuk melanjutkan"
                    : "Masuk dengan akun admin untuk mengelola sistem Central Printing"
            }
        >
            <Head title={isCustomerPortalEnabled ? "Log in" : "Admin Log in"} />

            <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Log in
                            </Button>
                        </div>

                        {isCustomerPortalEnabled ? (
                            <div className="text-center text-sm text-muted-foreground">
                                Belum punya akun?{' '}
                                <TextLink href={route('register')} tabIndex={5}>
                                    Daftar sekarang
                                </TextLink>
                            </div>
                        ) : (
                            <div className="rounded-lg bg-orange-50 p-3 text-center text-xs text-orange-800 border border-orange-200">
                                Fitur publik/pelanggan sedang dinonaktifkan untuk pemeliharaan sistem.
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
