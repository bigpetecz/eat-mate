import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { getLocalizedRoute } from './i18n';

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
  const { pathname } = request.nextUrl;

  // 1. Locale enforcement
  const pathnameHasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );
  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. Auth enforcement for protected routes
  // strip locale from path
  const [, locale, ...segments] = pathname.split('/');
  const pathWithoutLocale = '/' + segments.join('/');
  const protectedPaths = [
    getLocalizedRoute('favorites', 'en'),
    getLocalizedRoute('myRecipes', 'en'),
    getLocalizedRoute('recipeCreate', 'en'),
    getLocalizedRoute('recipeEdit', 'en', '*'),
    getLocalizedRoute('userSettings', 'en'),
    getLocalizedRoute('favorites', 'cs'),
    getLocalizedRoute('myRecipes', 'cs'),
    getLocalizedRoute('recipeCreate', 'cs'),
    getLocalizedRoute('recipeEdit', 'cs', '*'),
    getLocalizedRoute('userSettings', 'cs'),
  ];
  const isProtected = protectedPaths.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const token = request.cookies.get('token')?.value;
  if (isProtected && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next internals and API
    '/((?!api/|_next/|static/|favicon.ico).*)',
  ],
};
