import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'cs'];
const defaultLocale = 'en';

// Get the preferred locale, similar to the above or using a library
function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('accept-language');
  let languages: Array<string> = [];
  if (acceptLanguage) {
    languages = new Negotiator({
      headers: { 'accept-language': acceptLanguage },
    }).languages();
  }
  // Always fallback to defaultLocale if no valid language found
  const locale = match(languages, locales, defaultLocale) || defaultLocale;
  return locales.includes(locale) ? locale : defaultLocale;
}

export function middleware(request: NextRequest) {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    /**
     * Match all paths that do NOT start with:
     * - /api
     * - /_next
     * - /static
     * - /favicon.ico
     * - /images (optional)
     */
    '/((?!api/|_next/|static/|favicon.ico).*)',
  ],
};
