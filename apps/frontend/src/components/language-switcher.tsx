'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';

import {
  getLocalizedRoute,
  i18n,
  type Locale,
  resolveLocalizedPath,
} from '../i18n';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const languages = [
  { code: 'en', label: 'English', icon: <span>🇬🇧</span> },
  { code: 'cs', label: 'Čeština', icon: <span>🇨🇿</span> },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const resolveRecipeTranslationSlug = async (
    language: string,
    slug: string,
    targetLocale: Locale
  ): Promise<string | null> => {
    const recipeRes = await fetch(`/api/recipes/${language}/recipe/${slug}`, {
      cache: 'no-store',
    });
    if (!recipeRes.ok) {
      return null;
    }

    const recipeData = (await recipeRes.json()) as {
      id?: string;
      _id?: string;
      slug?: string;
    };
    const recipeId = recipeData.id || recipeData._id;

    if (!recipeId) {
      return null;
    }

    const translationsRes = await fetch(
      `/api/recipes/${recipeId}/translations`,
      {
        cache: 'no-store',
      }
    );

    if (!translationsRes.ok) {
      return null;
    }

    const translations = (await translationsRes.json()) as Array<{
      language?: string;
      slug?: string;
    }>;

    const targetTranslation = translations.find(
      (translation) => translation.language === targetLocale
    );

    return targetTranslation?.slug || null;
  };

  const handleChange = async (value: string) => {
    const locale = value as Locale;
    if (!i18n.locales.includes(locale)) return;

    const languageParam =
      typeof params?.language === 'string' ? params.language : null;
    const slugParam = typeof params?.slug === 'string' ? params.slug : null;
    const isRecipeDetailPath = /^\/(en|cs)\/(recipe|recept)\/[^/]+$/.test(
      pathname
    );

    // If on recipe detail page, try to navigate using translated slug.
    if (isRecipeDetailPath && languageParam && slugParam) {
      try {
        const translatedSlug = await resolveRecipeTranslationSlug(
          languageParam,
          slugParam,
          locale
        );

        if (translatedSlug) {
          router.push(
            getLocalizedRoute('recipeDetail', locale, translatedSlug)
          );
          return;
        }
      } catch {
        // Continue to fallback below.
      }
    }

    // fallback: just swap language in path
    const newPath = resolveLocalizedPath(pathname, locale);
    router.push(newPath);
  };

  return (
    <Select
      value={
        typeof params.language === 'string'
          ? params.language
          : params.language?.[0] ?? 'en'
      }
      onValueChange={handleChange}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map(({ code, label, icon }) => (
          <SelectItem key={code} value={code}>
            {icon} {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
