'use client';
import { useEffect } from 'react';
import { ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User } from '@/app/pages/auth/authStore';
import { Spinner } from '../ui/spinner';
import { getLocalizedRoute, Locale } from '@/i18n';

interface PrivatePageProps {
  user: User;
  children: ReactNode;
}

export default function PrivatePage({ user, children }: PrivatePageProps) {
  const router = useRouter();
  const { language = 'en' } = useParams();

  useEffect(() => {
    if (user === null) {
      router.replace(getLocalizedRoute('login', language as Locale));
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="flex items-center justify-center bg-muted min-h-[calc(100vh-8rem)] w-full">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
