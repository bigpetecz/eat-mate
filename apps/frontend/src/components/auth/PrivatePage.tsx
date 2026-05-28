import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { User } from '@/app/auth/authStore';
import { getLocalizedRoute, Locale } from '@/i18n';

interface PrivatePageProps {
  user: User | null;
  language: Locale;
  children: ReactNode;
}

export default function PrivatePage({
  user,
  language,
  children,
}: PrivatePageProps) {
  if (user === null) {
    redirect(getLocalizedRoute('login', language));
  }

  return <>{children}</>;
}
