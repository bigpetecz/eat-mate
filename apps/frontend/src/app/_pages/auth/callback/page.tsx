import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/server-api';
import { getLocalizedRoute, i18n, Locale, resolveLocalizedPath } from '@/i18n';

interface AuthCallbackPageProps {
  searchParams: Promise<{ state?: string }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const user = (await getAuthenticatedUser()) as { language?: string } | null;
  const { state } = await searchParams;
  const safeState = state && state.startsWith('/') ? state : null;

  const preferredLocale = i18n.locales.includes(user?.language as Locale)
    ? (user?.language as Locale)
    : i18n.defaultLocale;
  const fallbackPath = getLocalizedRoute('homepage', preferredLocale);
  const localizedPath = safeState
    ? resolveLocalizedPath(safeState, preferredLocale)
    : fallbackPath;

  const authRoutes = [
    getLocalizedRoute('login', preferredLocale),
    getLocalizedRoute('signUp', preferredLocale),
  ];
  const isAuthPath = authRoutes.some(
    (route) => localizedPath === route || localizedPath.startsWith(`${route}?`)
  );

  redirect(isAuthPath ? fallbackPath : localizedPath);
}
