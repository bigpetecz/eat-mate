'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Combobox } from '@/components/ui/combobox';

const languages = [
  { code: 'en', label: 'English', icon: <span>🇬🇧</span> },
  { code: 'cs', label: 'Čeština', icon: <span>🇨🇿</span> },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // Next.js i18n routing: /en/page, /cs/page, etc.
    const segments = pathname.split('/').filter(Boolean);
    if (languages.some((l) => l.code === segments[0])) {
      segments[0] = newLocale;
    } else {
      segments.unshift(newLocale);
    }
    const newPath = '/' + segments.join('/');
    router.push(newPath);
    i18n.changeLanguage(newLocale);
  };
  console.log('Current language:', i18n.language);

  return (
    <Combobox
      options={languages.map((l) => ({
        label: l.label,
        value: l.code,
        icon: l.icon,
      }))}
      value={i18n.language}
      onChange={handleChange}
      selectPlaceholder="Select language"
    />
  );
}
