export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'cs'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

interface DiscoverQueryParams {
  search?: string;
  cookingTime?: number;
  diets?: string;
  estimatedCostMax?: number;
  specialAttributes?: string;
}

const routes = {
  homepage: {
    en: '/',
    cs: '/cs',
  },
  discover: {
    en: (queryParams: DiscoverQueryParams | undefined) => {
      if (!queryParams) return '/en/discover';
      const {
        search,
        cookingTime,
        diets,
        estimatedCostMax,
        specialAttributes,
      } = queryParams;
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (cookingTime) params.set('cookTime', String(cookingTime));
      if (diets) params.set('diets', diets);
      if (estimatedCostMax)
        params.set('estimatedCostMax', String(estimatedCostMax));
      if (specialAttributes) params.set('specialAttributes', specialAttributes);
      return `/en/discover?${params.toString()}`;
    },
    cs: (queryParams: DiscoverQueryParams) => {
      if (!queryParams) return '/cs/objevuj';
      const {
        search,
        cookingTime,
        diets,
        estimatedCostMax,
        specialAttributes,
      } = queryParams;
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (cookingTime) params.set('cookTime', String(cookingTime));
      if (diets) params.set('diets', diets);
      if (estimatedCostMax)
        params.set('estimatedCostMax', String(estimatedCostMax));
      if (specialAttributes) params.set('specialAttributes', specialAttributes);
      return `/cs/objevuj?${params.toString()}`;
    },
  },
  recipes: {
    en: '/en/recipes',
    cs: '/cs/recepty',
  },
  signUp: {
    en: '/en/sign-up',
    cs: '/cs/registrace',
  },
  login: {
    en: '/en/sign-in',
    cs: '/cs/prihlasit-se',
  },
  logout: {
    en: '/en/logout',
    cs: '/cs/odhlasit',
  },
  userSettings: {
    en: '/en/settings',
    cs: '/cs/nastaveni',
  },
  recipeDetail: {
    en: (slug: string) => `/en/recipe/${slug}`,
    cs: (slug: string) => `/cs/recept/${slug}`,
  },
  recipeCreate: {
    en: '/en/recipe/create',
    cs: '/cs/recept/vytvorit',
  },
  recipeEdit: {
    en: (slug: string) => `/en/recipe/${slug}/edit`,
    cs: (slug: string) => `/cs/recept/${slug}/upravit`,
  },
  myRecipes: {
    en: '/en/my-recipes',
    cs: '/cs/moje-recepty',
  },
  favorites: {
    en: '/en/favorites',
    cs: '/cs/oblibene',
  },
} as const;

export const getLocalizedRoute = <
  RouteKey extends keyof typeof routes,
  L extends Locale = Locale
>(
  routeKey: RouteKey,
  locale: L,
  ...params: (typeof routes)[RouteKey][L] extends (...args: infer P) => string
    ? P
    : []
): string => {
  const route = routes[routeKey][locale];
  if (typeof route === 'function') {
    return (route as (...args: unknown[]) => string)(...params);
  }
  return route;
};

// Map current path to a route key and params, then get the new localized route

export const resolveLocalizedPath = (pathname: string, locale: Locale) => {
  if (!pathname) return '/';
  const localesPattern = i18n.locales.join('|');
  const matchers: Array<{
    key: keyof typeof routes;
    pattern: RegExp;
    paramNames?: string[];
  }> = [
    { key: 'discover', pattern: new RegExp(`^/(${localesPattern})/discover$`) },
    { key: 'recipes', pattern: new RegExp(`^/(${localesPattern})/recipes$`) },
    {
      key: 'signUp',
      pattern: new RegExp(`^/(${localesPattern})/(sign-up|registrace)$`),
    },
    {
      key: 'login',
      pattern: new RegExp(`^/(${localesPattern})/(login|prihlaseni)$`),
    },
    {
      key: 'userSettings',
      pattern: new RegExp(`^/(${localesPattern})/(settings|nastaveni)$`),
    },
    {
      key: 'recipeDetail',
      pattern: new RegExp(`^/(${localesPattern})/(recipe|recepty)/([^/]+)$`),
      paramNames: ['slug'],
    },
    {
      key: 'recipeCreate',
      pattern: new RegExp(
        `^/(${localesPattern})/(recipe|recepty)/(create|vytvorit)$`
      ),
    },
    {
      key: 'recipeEdit',
      pattern: new RegExp(
        `^/(${localesPattern})/(recipe|recepty)/([^/]+)/(edit|upravit)$`
      ),
      paramNames: ['slug'],
    },
    {
      key: 'myRecipes',
      pattern: new RegExp(`^/(${localesPattern})/(my-recipes|moje-recepty)$`),
    },
    {
      key: 'favorites',
      pattern: new RegExp(`^/(${localesPattern})/(favorites|oblíbene)$`),
    },
  ];
  for (const { key, pattern, paramNames } of matchers) {
    const match = pathname.match(pattern);
    if (match) {
      const params = paramNames ? paramNames.map((_, i) => match[i + 3]) : [];
      // @ts-expect-error: params are correct for function routes
      return getLocalizedRoute(key, locale, ...params);
    }
  }
  // fallback: just swap the language segment
  const segments = pathname.split('/');
  if (segments.length > 1 && i18n.locales.includes(segments[1] as Locale)) {
    segments[1] = locale;
    return segments.join('/');
  }
  // fallback: just prefix with locale
  return `/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
};
