'use client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { getLocalizedRoute, i18n, Locale, resolveLocalizedPath } from '@/i18n';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/app/api-client';
import { toApiClientError } from '@/lib/api-error';

export function LoginFormClient({
  className,
  dictionary,
  ...props
}: React.ComponentProps<'div'> & { dictionary: Record<string, string> }) {
  const params = useParams();
  const router = useRouter();
  const language =
    typeof params?.language === 'string' ? params.language : 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isAuthRoute = (path: string, locale: Locale) => {
    const authRoutes = [
      getLocalizedRoute('login', locale),
      getLocalizedRoute('signUp', locale),
    ];

    return authRoutes.some(
      (route) => path === route || path.startsWith(`${route}?`)
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post<{
        user?: {
          language?: 'en' | 'cs';
        };
      }>('/auth/login', { email, password });

      const preferredLocale = i18n.locales.includes(
        data?.user?.language as Locale
      )
        ? (data?.user?.language as Locale)
        : (language as Locale);

      document.cookie = `locale=${preferredLocale}; path=/; max-age=31536000; samesite=lax`;

      const state = new URLSearchParams(window.location.search).get('state');
      const requestedPath = state && state.startsWith('/') ? state : null;
      const fallbackPath = getLocalizedRoute('homepage', preferredLocale);
      const localizedPath = requestedPath
        ? resolveLocalizedPath(requestedPath, preferredLocale)
        : fallbackPath;
      const redirectPath = isAuthRoute(localizedPath, preferredLocale)
        ? fallbackPath
        : localizedPath;

      router.replace(redirectPath);
      router.refresh();
    } catch (error) {
      const apiError = toApiClientError(error);
      setServerError(
        apiError.message ||
          dictionary.loginFailed ||
          dictionary.networkError ||
          'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingState = urlParams.get('state');
    const fallbackPath = getLocalizedRoute('homepage', language as Locale);
    const state = encodeURIComponent(
      existingState && existingState.startsWith('/')
        ? existingState
        : fallbackPath
    );
    window.location.assign(`/api/auth/google?state=${state}`);
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.title}</CardTitle>
          <CardDescription>{dictionary.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">{dictionary.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">{dictionary.password}</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {dictionary.forgotPassword}
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              {serverError && (
                <div className="text-xs text-red-500">{serverError}</div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full cursor-pointer"
                >
                  {isSubmitting
                    ? dictionary.signingIn || 'Signing in...'
                    : dictionary.login}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={handleGoogleLogin}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {dictionary.loginWithGoogle}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              {dictionary.noAccount}{' '}
              <Link
                href={getLocalizedRoute('signUp', language as Locale)}
                className="underline underline-offset-4"
              >
                {dictionary.signUp}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
