'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';

import { i18n, type Locale, resolveLocalizedPath } from '../i18n';
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

  const handleChange = async (value: string) => {
    const locale = value as Locale;
    if (!i18n.locales.includes(locale)) return;

    // Check if on recipe detail page (params.slug and params.language)
    if (params?.slug && params?.language) {
      try {
        // Call recipe slug API to get slugMap
        const res = await fetch(
          `/api/recipes/${params.language}/recipe/${params.slug}`
        );
        const data = await res.json();
        if (data?.slugMap && data.slugMap[locale]) {
          // Build the new path for the recipe detail page
          const newPath = `/${locale}/${
            locale === 'en' ? 'recipe' : 'recept'
          }/${data.slugMap[locale]}`;
          router.push(newPath);
          return;
        }
      } catch (err) {
        // fallback: just swap language in path
        const newPath = resolveLocalizedPath(pathname, locale);
        router.push(newPath);
        return;
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
